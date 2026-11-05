import Capacitor

final class PicoBridgeViewController: CAPBridgeViewController {
    var usesLocalContent: Bool {
        guard let bridge else { return false }
        return bridge.config.serverURL == bridge.config.localURL
    }

    override func capacitorDidLoad() {
        // The interface is designed for fixed scale; pinch zoom left it stuck and out of proportion.
        webView?.scrollView.pinchGestureRecognizer?.isEnabled = false
        guard let bridge, usesLocalContent else { return }
        bridge.registerPluginInstance(PicoSecureSessionPlugin())
        bridge.registerPluginInstance(PicoLocalWorkspacePlugin())
        bridge.registerPluginInstance(PicoVideoPlayerPlugin())
    }
}
