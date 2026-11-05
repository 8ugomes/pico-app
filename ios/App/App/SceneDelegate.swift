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

        // Same brand background as the launch screen, with the Pico logo, so the
        // app switcher shows identity instead of private content.
        let background = UIImageView(image: UIImage(named: "Splash"))
        background.frame = cover.bounds
        background.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        background.contentMode = .scaleAspectFill
        background.clipsToBounds = true
        cover.addSubview(background)

        let logo = UIImageView(image: UIImage(named: "PicoLogo"))
        logo.translatesAutoresizingMaskIntoConstraints = false
        logo.contentMode = .scaleAspectFit
        cover.addSubview(logo)
        NSLayoutConstraint.activate([
            logo.centerXAnchor.constraint(equalTo: cover.centerXAnchor),
            logo.centerYAnchor.constraint(equalTo: cover.centerYAnchor),
            logo.widthAnchor.constraint(equalTo: cover.widthAnchor, multiplier: 0.9),
            logo.heightAnchor.constraint(equalTo: logo.widthAnchor)
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
