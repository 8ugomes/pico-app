import Capacitor

final class PicoBridgeViewController: CAPBridgeViewController {
    var usesLocalContent: Bool {
        guard let bridge else { return false }
        return bridge.config.serverURL == bridge.config.localURL
    }

    override func capacitorDidLoad() {
        guard let bridge, usesLocalContent else { return }
        bridge.registerPluginInstance(PicoSecureSessionPlugin())
        bridge.registerPluginInstance(PicoVideoPlayerPlugin())
    }
}
