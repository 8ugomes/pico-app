import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

function command(name, args = []) {
  const result = spawnSync(name, args, { encoding: 'utf8' });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim().split('\n')[0] || null;
  return { available: result.status === 0, detail: output };
}

function firstExisting(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate)) || null;
}

function pathCheck(candidate, missingDetail = null) {
  return {
    available: Boolean(candidate),
    detail: candidate || missingDetail,
  };
}

function availableIosRuntime() {
  const result = spawnSync('xcrun', ['simctl', 'list', 'runtimes', 'available', '--json'], { encoding: 'utf8' });
  if (result.status !== 0) {
    const detail = `${result.stderr || result.stdout || ''}`.trim().split('\n')[0] || null;
    return { available: false, detail };
  }

  try {
    const runtimes = JSON.parse(result.stdout).runtimes || [];
    const iosRuntimes = runtimes.filter((runtime) => runtime.isAvailable && runtime.identifier?.includes('iOS'));
    return {
      available: iosRuntimes.length > 0,
      detail: iosRuntimes.map((runtime) => runtime.name).join(', ') || 'nenhum runtime iOS disponível',
    };
  } catch {
    return { available: false, detail: 'resposta inválida de simctl' };
  }
}

function firstAndroidArm64Image(androidSdkPath) {
  const imageRoot = androidSdkPath && path.join(androidSdkPath, 'system-images', 'android-36');
  if (!imageRoot || !existsSync(imageRoot)) return null;

  for (const channel of readdirSync(imageRoot, { withFileTypes: true })) {
    if (!channel.isDirectory()) continue;
    const arm64Path = path.join(imageRoot, channel.name, 'arm64-v8a');
    if (existsSync(arm64Path)) return arm64Path;
  }
  return null;
}

const xcode = command('xcodebuild', ['-version']);
if (xcode.available) {
  const major = Number(xcode.detail?.match(/^Xcode (\d+)/)?.[1]);
  if (!Number.isFinite(major) || major < 26) {
    xcode.available = false;
    xcode.detail = `${xcode.detail || 'versão desconhecida'}; requer Xcode 26+`;
  }
}

const home = homedir();
const androidSdkPath = firstExisting([
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  path.join(home, 'Library/Android/sdk'),
  path.join(home, 'Android/Sdk'),
]);
const androidStudioPath = firstExisting([
  '/Applications/Android Studio.app',
  path.join(home, 'Applications/Android Studio.app'),
  '/opt/android-studio',
  path.join(home, 'android-studio'),
]);
const java = command('java', ['-version']);
if (java.available) {
  const major = Number(java.detail?.match(/version "(\d+)/)?.[1]);
  if (!Number.isFinite(major) || major < 17 || major > 24) {
    java.available = false;
    java.detail = `${java.detail || 'versão desconhecida'}; Gradle 8.14 requer Java 17–24`;
  }
}

const androidSdkManagerPath = firstExisting([
  androidSdkPath && path.join(androidSdkPath, 'cmdline-tools', 'latest', 'bin', 'sdkmanager'),
  androidSdkPath && path.join(androidSdkPath, 'cmdline-tools', 'bin', 'sdkmanager'),
]);
const androidPlatform36Path = firstExisting([
  androidSdkPath && path.join(androidSdkPath, 'platforms', 'android-36', 'android.jar'),
]);
const androidBuildToolsRoot = androidSdkPath && path.join(androidSdkPath, 'build-tools');
const androidBuildTools36Path = androidBuildToolsRoot && existsSync(androidBuildToolsRoot)
  ? firstExisting(
      readdirSync(androidBuildToolsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('36.'))
        .map((entry) => path.join(androidBuildToolsRoot, entry.name)),
    )
  : null;
const androidPlatformToolsPath = firstExisting([
  androidSdkPath && path.join(androidSdkPath, 'platform-tools', 'adb'),
]);
const androidEmulatorPath = firstExisting([
  androidSdkPath && path.join(androidSdkPath, 'emulator', 'emulator'),
]);
const androidArm64SystemImagePath = firstAndroidArm64Image(androidSdkPath);

const checks = {
  node: { available: Number(process.versions.node.split('.')[0]) >= 22, detail: process.version },
  capacitorConfig: { available: existsSync('capacitor.config.ts'), detail: 'capacitor.config.ts' },
  iosProject: { available: existsSync('ios/App'), detail: 'ios/App' },
  androidProject: { available: existsSync('android/app'), detail: 'android/app' },
  xcode,
  iosSimulatorRuntime: availableIosRuntime(),
  androidStudio: { available: Boolean(androidStudioPath), detail: androidStudioPath },
  java,
  androidSdk: pathCheck(androidSdkPath),
  androidSdkManager: pathCheck(androidSdkManagerPath, 'cmdline-tools/latest/bin/sdkmanager'),
  androidPlatform36: pathCheck(androidPlatform36Path, 'platforms/android-36'),
  androidBuildTools36: pathCheck(androidBuildTools36Path, 'build-tools/36.x'),
  androidPlatformTools: pathCheck(androidPlatformToolsPath, 'platform-tools/adb'),
  androidEmulator: pathCheck(androidEmulatorPath, 'emulator/emulator'),
  androidArm64SystemImage: pathCheck(androidArm64SystemImagePath, 'system-images/android-36/*/arm64-v8a'),
};

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(checks, null, 2)}\n`);
} else {
  for (const [name, result] of Object.entries(checks)) {
    process.stdout.write(`${result.available ? 'OK' : 'PENDENTE'}  ${name}${result.detail ? `: ${result.detail}` : ''}\n`);
  }
}

if (process.argv.includes('--strict') && Object.values(checks).some((result) => !result.available)) {
  process.exitCode = 1;
}
