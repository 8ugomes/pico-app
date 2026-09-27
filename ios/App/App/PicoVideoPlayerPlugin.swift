import AVFoundation
import AVKit
import Capacitor
import Foundation

private final class PicoVideoTaskContext {
    let loadingRequest: AVAssetResourceLoadingRequest
    let task: URLSessionDataTask
    let rangeStart: Int64
    let rangeEnd: Int64
    var responseEnd: Int64?
    var totalLength: Int64?
    var receivedLength: Int64 = 0

    init(
        loadingRequest: AVAssetResourceLoadingRequest,
        task: URLSessionDataTask,
        rangeStart: Int64,
        rangeEnd: Int64
    ) {
        self.loadingRequest = loadingRequest
        self.task = task
        self.rangeStart = rangeStart
        self.rangeEnd = rangeEnd
    }
}

private final class PicoVideoResourceLoader: NSObject, AVAssetResourceLoaderDelegate, URLSessionDataDelegate {
    private let apiOrigin: URL
    private let path: String
    private let accessToken: String
    private let clientVersion: String
    private let lock = NSLock()
    private var requests: [Int: PicoVideoTaskContext] = [:]
    private var cancelledRequestIDs = Set<ObjectIdentifier>()
    private lazy var session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.urlCache = nil
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        return URLSession(configuration: configuration, delegate: self, delegateQueue: queue)
    }()

    init(apiOrigin: URL, path: String, accessToken: String, clientVersion: String) {
        self.apiOrigin = apiOrigin
        self.path = path
        self.accessToken = accessToken
        self.clientVersion = clientVersion
    }

    func resourceLoader(
        _ resourceLoader: AVAssetResourceLoader,
        shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest
    ) -> Bool {
        guard loadingRequest.dataRequest != nil || loadingRequest.contentInformationRequest != nil else {
            return false
        }
        return startNextChunk(for: loadingRequest)
    }

    func resourceLoader(
        _ resourceLoader: AVAssetResourceLoader,
        didCancel loadingRequest: AVAssetResourceLoadingRequest
    ) {
        let requestID = ObjectIdentifier(loadingRequest)
        lock.lock()
        cancelledRequestIDs.insert(requestID)
        let contexts = requests.values.filter { $0.loadingRequest === loadingRequest }
        contexts.forEach { requests.removeValue(forKey: $0.task.taskIdentifier) }
        lock.unlock()
        contexts.forEach { $0.task.cancel() }
    }

    func urlSession(
        _ session: URLSession,
        dataTask: URLSessionDataTask,
        didReceive response: URLResponse,
        completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
    ) {
        guard let context = context(for: dataTask.taskIdentifier),
              let http = response as? HTTPURLResponse,
              http.statusCode == 206,
              let contentRangeValue = http.value(forHTTPHeaderField: "Content-Range"),
              let contentRange = parseContentRange(contentRangeValue),
              contentRange.start == context.rangeStart,
              contentRange.end >= context.rangeStart,
              contentRange.end <= context.rangeEnd,
              contentRange.total > contentRange.end else {
            completionHandler(.cancel)
            finish(taskIdentifier: dataTask.taskIdentifier, error: URLError(.badServerResponse))
            return
        }

        lock.lock()
        context.responseEnd = contentRange.end
        context.totalLength = contentRange.total
        lock.unlock()

        if let information = context.loadingRequest.contentInformationRequest {
            information.contentType = AVFileType.mp4.rawValue
            information.isByteRangeAccessSupported = true
            information.contentLength = contentRange.total
        }
        completionHandler(.allow)
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        guard !data.isEmpty, let context = context(for: dataTask.taskIdentifier) else { return }
        lock.lock()
        let responseEnd = context.responseEnd
        let nextLength = context.receivedLength + Int64(data.count)
        let exceedsResponse = responseEnd.map { context.rangeStart + nextLength - 1 > $0 } ?? true
        if !exceedsResponse {
            context.receivedLength = nextLength
        }
        lock.unlock()

        guard !exceedsResponse else {
            context.task.cancel()
            finish(taskIdentifier: dataTask.taskIdentifier, error: URLError(.badServerResponse))
            return
        }
        context.loadingRequest.dataRequest?.respond(with: data)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        finish(taskIdentifier: task.taskIdentifier, error: error)
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }

    private func context(for taskIdentifier: Int) -> PicoVideoTaskContext? {
        lock.lock()
        defer { lock.unlock() }
        return requests[taskIdentifier]
    }

    private func finish(taskIdentifier: Int, error: Error?) {
        lock.lock()
        let context = requests.removeValue(forKey: taskIdentifier)
        let wasCancelled = context.map { cancelledRequestIDs.contains(ObjectIdentifier($0.loadingRequest)) } ?? false
        lock.unlock()
        guard let context, !context.loadingRequest.isFinished, !wasCancelled else { return }

        if let error {
            context.loadingRequest.finishLoading(with: error)
            return
        }

        guard let responseEnd = context.responseEnd,
              context.receivedLength == responseEnd - context.rangeStart + 1 else {
            context.loadingRequest.finishLoading(with: URLError(.networkConnectionLost))
            return
        }

        guard let dataRequest = context.loadingRequest.dataRequest else {
            context.loadingRequest.finishLoading()
            return
        }
        let targetOffset = targetOffset(for: dataRequest, totalLength: context.totalLength)
        if dataRequest.currentOffset < targetOffset {
            _ = startNextChunk(for: context.loadingRequest)
        } else {
            context.loadingRequest.finishLoading()
        }
    }

    private func startNextChunk(for loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        guard !loadingRequest.isFinished, !isCancelled(loadingRequest),
              var components = URLComponents(url: apiOrigin, resolvingAgainstBaseURL: false) else {
            return false
        }
        components.path = "/api/mobile/v1/video"
        components.queryItems = [URLQueryItem(name: "path", value: path)]
        guard let url = components.url else {
            loadingRequest.finishLoading(with: URLError(.badURL))
            return false
        }

        let start: Int64
        let end: Int64
        if let dataRequest = loadingRequest.dataRequest {
            start = max(dataRequest.currentOffset, dataRequest.requestedOffset)
            let target = targetOffset(for: dataRequest, totalLength: knownContentLength(for: loadingRequest))
            guard start < target else {
                loadingRequest.finishLoading()
                return true
            }
            let requestedLength = dataRequest.requestsAllDataToEndOfResource
                ? 1024 * 1024
                : max(1, dataRequest.requestedLength)
            let chunkLength = Int64(min(requestedLength, 1024 * 1024))
            end = start + min(chunkLength, target - start) - 1
        } else {
            start = 0
            end = 0
        }

        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        request.httpShouldHandleCookies = false
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("capacitor://localhost", forHTTPHeaderField: "Origin")
        request.setValue(clientVersion, forHTTPHeaderField: "X-Pico-Client-Version")
        request.setValue("bytes=\(start)-\(end)", forHTTPHeaderField: "Range")

        let task = session.dataTask(with: request)
        let context = PicoVideoTaskContext(
            loadingRequest: loadingRequest,
            task: task,
            rangeStart: start,
            rangeEnd: end
        )
        lock.lock()
        if cancelledRequestIDs.contains(ObjectIdentifier(loadingRequest)) {
            lock.unlock()
            task.cancel()
            return false
        }
        requests[task.taskIdentifier] = context
        lock.unlock()
        task.resume()
        return true
    }

    private func knownContentLength(for loadingRequest: AVAssetResourceLoadingRequest) -> Int64? {
        guard let contentLength = loadingRequest.contentInformationRequest?.contentLength,
              contentLength > 0 else { return nil }
        return contentLength
    }

    private func targetOffset(
        for dataRequest: AVAssetResourceLoadingDataRequest,
        totalLength: Int64?
    ) -> Int64 {
        if dataRequest.requestsAllDataToEndOfResource {
            return totalLength ?? dataRequest.currentOffset + 1024 * 1024
        }
        let requestedLength = Int64(max(0, dataRequest.requestedLength))
        let (requestedEnd, overflow) = dataRequest.requestedOffset.addingReportingOverflow(requestedLength)
        let boundedEnd = overflow ? Int64.max : requestedEnd
        return min(totalLength ?? boundedEnd, boundedEnd)
    }

    private func isCancelled(_ loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return cancelledRequestIDs.contains(ObjectIdentifier(loadingRequest))
    }

    private func parseContentRange(_ value: String) -> (start: Int64, end: Int64, total: Int64)? {
        let unitsAndValue = value.split(separator: " ", maxSplits: 1)
        guard unitsAndValue.count == 2, unitsAndValue[0].lowercased() == "bytes" else { return nil }
        let rangeAndTotal = unitsAndValue[1].split(separator: "/", maxSplits: 1)
        guard rangeAndTotal.count == 2,
              let total = Int64(rangeAndTotal[1]) else { return nil }
        let bounds = rangeAndTotal[0].split(separator: "-", maxSplits: 1)
        guard bounds.count == 2,
              let start = Int64(bounds[0]),
              let end = Int64(bounds[1]) else { return nil }
        return (start, end, total)
    }

    func invalidate() {
        lock.lock()
        let active = Array(requests.values)
        active.forEach { cancelledRequestIDs.insert(ObjectIdentifier($0.loadingRequest)) }
        requests.removeAll()
        lock.unlock()
        session.invalidateAndCancel()
        let loadingRequests = Dictionary(
            active.map { (ObjectIdentifier($0.loadingRequest), $0.loadingRequest) },
            uniquingKeysWith: { first, _ in first }
        ).values
        loadingRequests.filter { !$0.isFinished }.forEach {
            $0.finishLoading(with: URLError(.cancelled))
        }
    }
}

@objc(PicoVideoPlayerPlugin)
final class PicoVideoPlayerPlugin: CAPPlugin, CAPBridgedPlugin, UIAdaptivePresentationControllerDelegate {
    let identifier = "PicoVideoPlayerPlugin"
    let jsName = "PicoVideoPlayer"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise)
    ]

    private var playerController: AVPlayerViewController?
    private var resourceLoader: PicoVideoResourceLoader?

    private var configuredAPIOrigin: URL? {
        guard let configuredValue = Bundle.main.object(forInfoDictionaryKey: "PicoMobileAPIOrigin") as? String,
              !configuredValue.isEmpty,
              let origin = URL(string: configuredValue),
              origin.scheme == "https",
              origin.host != nil,
              origin.user == nil,
              origin.password == nil,
              origin.port == nil,
              origin.path.isEmpty,
              origin.query == nil,
              origin.fragment == nil,
              origin.absoluteString == configuredValue else {
            return nil
        }
        return origin
    }

    @objc func play(_ call: CAPPluginCall) {
        guard let allowedOrigin = configuredAPIOrigin,
              let originValue = call.getString("apiOrigin"),
              let origin = URL(string: originValue),
              originValue == allowedOrigin.absoluteString,
              origin == allowedOrigin,
              let path = call.getString("path"),
              path.range(of: "^[0-9a-f-]{36}/[0-9a-f-]{36}\\.mp4$", options: .regularExpression) != nil,
              let token = call.getString("accessToken"), token.count >= 20,
              let version = call.getString("clientVersion"),
              version.range(of: "^[0-9]+\\.[0-9]+\\.[0-9]+$", options: .regularExpression) != nil else {
            call.reject("Não foi possível abrir este vídeo.", "PRIVATE_VIDEO_INVALID_INPUT")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self, let presenter = self.bridge?.viewController else {
                call.reject("Não foi possível abrir este vídeo.", "PRIVATE_VIDEO_UNAVAILABLE")
                return
            }
            self.stopPlayback()
            let loader = PicoVideoResourceLoader(
                apiOrigin: origin,
                path: path,
                accessToken: token,
                clientVersion: version
            )
            let assetURL = URL(string: "pico-video://localhost/\(path)")!
            let asset = AVURLAsset(url: assetURL)
            asset.resourceLoader.setDelegate(loader, queue: DispatchQueue(label: "PicoVideoResourceLoader"))
            let controller = AVPlayerViewController()
            controller.player = AVPlayer(playerItem: AVPlayerItem(asset: asset))
            controller.presentationController?.delegate = self
            self.resourceLoader = loader
            self.playerController = controller
            presenter.present(controller, animated: true) {
                controller.presentationController?.delegate = self
                controller.player?.play()
                call.resolve()
            }
        }
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        stopPlayback()
    }

    private func stopPlayback() {
        playerController?.player?.pause()
        playerController = nil
        resourceLoader?.invalidate()
        resourceLoader = nil
    }
}
