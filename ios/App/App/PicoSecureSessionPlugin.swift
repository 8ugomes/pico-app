import Capacitor
import Foundation
import Security

@objc(PicoSecureSessionPlugin)
final class PicoSecureSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "PicoSecureSessionPlugin"
    let jsName = "PicoSecureSession"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveRefreshToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readRefreshToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearRefreshToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "releasePrivacyCover", returnType: CAPPluginReturnPromise)
    ]

    private let keychainService = "PicoSocial.SecureSession"
    private let keychainAccount = "refresh-token"
    private let installationMarker = "PicoSocial.InstallationMarker.v1"
    private let keychainQueue = DispatchQueue(label: "social.pico.secure-session")

    override func load() {
        super.load()
        keychainQueue.async { [weak self] in
            _ = self?.ensureInstallationReady()
        }
    }

    /// Keychain items survive an app uninstall. The UserDefaults marker does not, so a
    /// missing marker must delete any stale refresh token before reads or writes can run.
    /// Failures leave the marker unset and every later operation retries on the same queue.
    private func ensureInstallationReady() -> Bool {
        let defaults = UserDefaults.standard
        guard !defaults.bool(forKey: installationMarker) else { return true }
        let status = SecItemDelete(itemQuery as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { return false }
        defaults.set(true, forKey: installationMarker)
        return true
    }

    private var itemQuery: [CFString: Any] {
        [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: keychainService,
            kSecAttrAccount: keychainAccount,
            kSecAttrSynchronizable: kCFBooleanFalse as Any,
            kSecUseDataProtectionKeychain: kCFBooleanTrue as Any
        ]
    }

    @objc func saveRefreshToken(_ call: CAPPluginCall) {
        guard let refreshToken = call.getString("refreshToken"), !refreshToken.isEmpty else {
            call.reject("O refresh token é obrigatório.", "SECURE_SESSION_INVALID_TOKEN")
            return
        }

        keychainQueue.async {
            guard self.ensureInstallationReady() else {
                call.reject("Não foi possível salvar a sessão segura.", "SECURE_SESSION_WRITE_FAILED")
                return
            }

            let valueData = Data(refreshToken.utf8)
            let updatedAttributes: [CFString: Any] = [
                kSecValueData: valueData,
                kSecAttrAccessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            ]

            let updateStatus = SecItemUpdate(
                self.itemQuery as CFDictionary,
                updatedAttributes as CFDictionary
            )

            if updateStatus == errSecSuccess {
                call.resolve()
                return
            }

            guard updateStatus == errSecItemNotFound else {
                call.reject("Não foi possível salvar a sessão segura.", "SECURE_SESSION_WRITE_FAILED")
                return
            }

            var newItem = self.itemQuery
            newItem[kSecValueData] = valueData
            newItem[kSecAttrAccessible] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly

            guard SecItemAdd(newItem as CFDictionary, nil) == errSecSuccess else {
                call.reject("Não foi possível salvar a sessão segura.", "SECURE_SESSION_WRITE_FAILED")
                return
            }

            call.resolve()
        }
    }

    @objc func readRefreshToken(_ call: CAPPluginCall) {
        keychainQueue.async {
            guard self.ensureInstallationReady() else {
                call.reject("Não foi possível ler a sessão segura.", "SECURE_SESSION_READ_FAILED")
                return
            }

            var query = self.itemQuery
            query[kSecReturnData] = kCFBooleanTrue
            query[kSecMatchLimit] = kSecMatchLimitOne

            var result: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &result)

            if status == errSecItemNotFound {
                call.resolve(["refreshToken": NSNull()])
                return
            }

            guard status == errSecSuccess,
                  let tokenData = result as? Data,
                  let refreshToken = String(data: tokenData, encoding: .utf8),
                  !refreshToken.isEmpty else {
                call.reject("Não foi possível ler a sessão segura.", "SECURE_SESSION_READ_FAILED")
                return
            }

            call.resolve(["refreshToken": refreshToken])
        }
    }

    @objc func clearRefreshToken(_ call: CAPPluginCall) {
        keychainQueue.async {
            guard self.ensureInstallationReady() else {
                call.reject("Não foi possível limpar a sessão segura.", "SECURE_SESSION_DELETE_FAILED")
                return
            }

            let status = SecItemDelete(self.itemQuery as CFDictionary)

            guard status == errSecSuccess || status == errSecItemNotFound else {
                call.reject("Não foi possível limpar a sessão segura.", "SECURE_SESSION_DELETE_FAILED")
                return
            }

            call.resolve()
        }
    }

    @objc func releasePrivacyCover(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: .picoForegroundReady, object: nil)
            call.resolve()
        }
    }
}

extension Notification.Name {
    static let picoForegroundReady = Notification.Name("PicoForegroundReady")
}
