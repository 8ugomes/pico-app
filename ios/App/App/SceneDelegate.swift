import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var privacyCover: UIView?
    private var foregroundObserver: NSObjectProtocol?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = PicoBridgeViewController()
        window?.makeKeyAndVisible()
        foregroundObserver = NotificationCenter.default.addObserver(
            forName: .picoForegroundReady,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.releasePrivacyCover()
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        guard let window else { return }
        if let existing = privacyCover {
            // A fade-out may still be running when the app becomes inactive again.
            existing.layer.removeAllAnimations()
            existing.alpha = 1
            return
        }
        let cover = UIView(frame: window.bounds)
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        cover.backgroundColor = UIColor(red: 248 / 255, green: 243 / 255, blue: 231 / 255, alpha: 1)

        let title = UILabel()
        title.translatesAutoresizingMaskIntoConstraints = false
        title.text = "Pico Social"
        title.textColor = UIColor(red: 68 / 255, green: 52 / 255, blue: 47 / 255, alpha: 1)
        title.font = .systemFont(ofSize: 28, weight: .semibold)
        cover.addSubview(title)
        NSLayoutConstraint.activate([
            title.centerXAnchor.constraint(equalTo: cover.centerXAnchor),
            title.centerYAnchor.constraint(equalTo: cover.centerYAnchor)
        ])

        window.addSubview(cover)
        privacyCover = cover
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // The local client removes the cover only after it revalidates the
        // account or replaces private content with an explicit offline/error state.
        if let bridge = window?.rootViewController as? PicoBridgeViewController,
           !bridge.usesLocalContent {
            releasePrivacyCover()
        }
    }

    private func releasePrivacyCover() {
        guard let cover = privacyCover else { return }
        // A short fade keeps the cover from flashing when the user cancels the
        // app switcher gesture. It is installed instantly, so snapshots stay private.
        UIView.animate(withDuration: 0.2, delay: 0, options: [.curveEaseOut], animations: {
            cover.alpha = 0
        }, completion: { [weak self] finished in
            guard finished, let self, self.privacyCover === cover else { return }
            self.privacyCover?.removeFromSuperview()
            self.privacyCover = nil
        })
    }
}
