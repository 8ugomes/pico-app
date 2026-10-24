import Capacitor
import Foundation

@objc(PicoLocalWorkspacePlugin)
final class PicoLocalWorkspacePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "PicoLocalWorkspacePlugin"
    let jsName = "PicoLocalWorkspace"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]

    private let fileManager = FileManager.default
    private let storageQueue = DispatchQueue(label: "social.pico.local-workspace", qos: .userInitiated)
    private let maximumWorkspaceCharacters = 1_000_000
    private let maximumWorkspaceBytes = 4_000_000
    private let legacyWorkspacePreferenceKeys = [
        "CapacitorStorage.pico.mobile.local.v1.workspace",
        "pico.mobile.local.v1.workspace"
    ]

    private func workspaceFileURL() throws -> URL {
        let applicationSupport = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        let directory = applicationSupport
            .appendingPathComponent("PicoSocial", isDirectory: true)
            .appendingPathComponent("LocalWorkspace", isDirectory: true)

        try fileManager.createDirectory(
            at: directory,
            withIntermediateDirectories: true,
            attributes: [.protectionKey: FileProtectionType.complete]
        )
        try secureItem(at: directory)
        return directory.appendingPathComponent("workspace-v1.json", isDirectory: false)
    }

    private func secureItem(at url: URL) throws {
        try fileManager.setAttributes(
            [.protectionKey: FileProtectionType.complete],
            ofItemAtPath: url.path
        )
        var protectedURL = url
        var resourceValues = URLResourceValues()
        resourceValues.isExcludedFromBackup = true
        try protectedURL.setResourceValues(resourceValues)
    }

    private func clearLegacyWorkspacePreferences() {
        for key in legacyWorkspacePreferenceKeys {
            UserDefaults.standard.removeObject(forKey: key)
        }
        // A legacy privacy migration must reach disk before the app can be suspended.
        _ = UserDefaults.standard.synchronize()
    }

    private func clearTemporaryWorkspaceFiles(in directory: URL) throws {
        let contents = try fileManager.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: nil
        )
        for item in contents {
            let name = item.lastPathComponent
            guard name.hasPrefix(".workspace-"), name.hasSuffix(".tmp") else {
                continue
            }
            try fileManager.removeItem(at: item)
        }
    }

    @objc func read(_ call: CAPPluginCall) {
        storageQueue.async {
            do {
                let fileURL = try self.workspaceFileURL()
                try self.clearTemporaryWorkspaceFiles(in: fileURL.deletingLastPathComponent())
                guard self.fileManager.fileExists(atPath: fileURL.path) else {
                    call.resolve(["value": NSNull()])
                    return
                }

                try self.secureItem(at: fileURL)
                let attributes = try self.fileManager.attributesOfItem(atPath: fileURL.path)
                if let size = attributes[.size] as? NSNumber,
                   size.intValue > self.maximumWorkspaceBytes {
                    call.reject(
                        "Os dados locais excedem o limite permitido.",
                        "LOCAL_WORKSPACE_TOO_LARGE"
                    )
                    return
                }

                let data = try Data(contentsOf: fileURL)
                guard let value = String(data: data, encoding: .utf8) else {
                    call.reject(
                        "Os dados locais estão corrompidos.",
                        "LOCAL_WORKSPACE_CORRUPT"
                    )
                    return
                }
                guard value.utf16.count <= self.maximumWorkspaceCharacters else {
                    call.reject(
                        "Os dados locais excedem o limite permitido.",
                        "LOCAL_WORKSPACE_TOO_LARGE"
                    )
                    return
                }

                call.resolve(["value": value])
            } catch {
                call.reject(
                    "Não foi possível ler os dados locais neste iPhone.",
                    "LOCAL_WORKSPACE_READ_FAILED"
                )
            }
        }
    }

    @objc func write(_ call: CAPPluginCall) {
        guard let value = call.getString("value") else {
            call.reject(
                "Os dados locais são obrigatórios.",
                "LOCAL_WORKSPACE_INVALID_VALUE"
            )
            return
        }
        guard value.utf16.count <= maximumWorkspaceCharacters,
              let data = value.data(using: .utf8),
              data.count <= maximumWorkspaceBytes else {
            call.reject(
                "Os dados locais excedem o limite permitido.",
                "LOCAL_WORKSPACE_TOO_LARGE"
            )
            return
        }

        storageQueue.async {
            var temporaryURL: URL?
            do {
                let fileURL = try self.workspaceFileURL()
                try self.clearTemporaryWorkspaceFiles(in: fileURL.deletingLastPathComponent())
                let candidate = fileURL
                    .deletingLastPathComponent()
                    .appendingPathComponent(".workspace-\(UUID().uuidString).tmp", isDirectory: false)
                temporaryURL = candidate
                try data.write(to: candidate, options: [.completeFileProtection])
                try self.secureItem(at: candidate)
                if self.fileManager.fileExists(atPath: fileURL.path) {
                    _ = try self.fileManager.replaceItemAt(
                        fileURL,
                        withItemAt: candidate,
                        backupItemName: nil,
                        options: [.usingNewMetadataOnly]
                    )
                } else {
                    try self.fileManager.moveItem(at: candidate, to: fileURL)
                }
                temporaryURL = nil
                self.clearLegacyWorkspacePreferences()
                call.resolve()
            } catch {
                if let temporaryURL {
                    try? self.fileManager.removeItem(at: temporaryURL)
                }
                call.reject(
                    "Não foi possível salvar os dados locais neste iPhone.",
                    "LOCAL_WORKSPACE_WRITE_FAILED"
                )
            }
        }
    }

    @objc func clear(_ call: CAPPluginCall) {
        storageQueue.async {
            do {
                let fileURL = try self.workspaceFileURL()
                if self.fileManager.fileExists(atPath: fileURL.path) {
                    try self.fileManager.removeItem(at: fileURL)
                }
                try self.clearTemporaryWorkspaceFiles(in: fileURL.deletingLastPathComponent())
                self.clearLegacyWorkspacePreferences()
                call.resolve()
            } catch {
                call.reject(
                    "Não foi possível apagar os dados locais neste iPhone.",
                    "LOCAL_WORKSPACE_DELETE_FAILED"
                )
            }
        }
    }
}
