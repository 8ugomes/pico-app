import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);

function read(root, relativePath) {
  const path = join(root, relativePath);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function listTextFiles(directory) {
  if (!existsSync(directory)) return [];
  const results = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const metadata = statSync(path);
    if (metadata.isDirectory()) results.push(...listTextFiles(path));
    else if (['.css', '.html', '.js', '.json', '.map', '.txt', '.xml'].includes(extname(path))) results.push(path);
  }
  return results;
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlaceholder(value) {
  return !value || /preview|placeholder|pendente|definir|exemplo|example|\[\[|localhost/i.test(value);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validHttpsOrigin(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && !parsed.username
      && !parsed.password
      && parsed.pathname === '/'
      && !parsed.search
      && !parsed.hash;
  } catch {
    return false;
  }
}

function plistString(contents, key) {
  return contents.match(new RegExp(`<key>${key}<\\/key>\\s*<string>([^<]*)<\\/string>`))?.[1]?.trim() || '';
}

function buildSettingValues(contents, key) {
  return [...contents.matchAll(new RegExp(`${key}\\s*=\\s*"?([^;"\\n]+)"?;`, 'g'))]
    .map((match) => match[1].trim());
}

function oneCheck(id, label, ok, detail, kind = 'technical') {
  return { id, label, ok: Boolean(ok), detail, kind };
}

function installedSigningIdentities() {
  const result = spawnSync('security', ['find-identity', '-v', '-p', 'codesigning'], {
    encoding: 'utf8',
    timeout: 10_000,
  });
  if (result.status !== 0) return [];
  return [...result.stdout.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const secretSignatures = [
  ['chave de serviço Supabase', /SUPABASE_SERVICE_ROLE_KEY\s*(?:=|:)/i],
  ['token secreto Supabase', /\bsb_secret_[A-Za-z0-9_-]+/],
  ['URL de banco com credenciais', /DATABASE_URL\s*(?:=|:)/i],
  ['token Vercel', /VERCEL_TOKEN\s*(?:=|:)/i],
  ['chave privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['chave secreta de provedor', /\bsk_(?:live|test)_[A-Za-z0-9_-]+/],
];

/**
 * Inspect release readiness without writing files, changing signing state or
 * invoking Xcode. Human-controlled values are required explicitly via env.
 *
 * @param {{ root?: string, env?: Record<string, string | undefined>, signingIdentities?: string[] }} options
 */
export function inspectIosRelease({
  root = resolve(fileURLToPath(new URL('..', import.meta.url))),
  env = process.env,
  signingIdentities = installedSigningIdentities(),
} = {}) {
  const plist = read(root, 'ios/App/App/Info.plist');
  const project = read(root, 'ios/App/App.xcodeproj/project.pbxproj');
  const scheme = read(root, 'ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme');
  const privacy = read(root, 'ios/App/App/PrivacyInfo.xcprivacy');
  const configText = read(root, 'ios/App/App/capacitor.config.json');
  const publicDirectory = join(root, 'ios/App/App/public');
  const publicIndex = read(root, 'ios/App/App/public/index.html');
  const publicScript = read(root, 'ios/App/App/public/app.js');
  const publicStyles = read(root, 'ios/App/App/public/app.css');

  let config = null;
  try {
    config = configText ? JSON.parse(configText) : null;
  } catch {
    config = null;
  }

  const packagedFiles = listTextFiles(publicDirectory);
  const secretFindings = [];
  let debugCalls = false;
  for (const path of packagedFiles) {
    const contents = readFileSync(path, 'utf8');
    if (extname(path) === '.js' && /\bconsole\.(?:debug|log|trace)\s*\(|\bdebugger\s*;/.test(contents)) {
      debugCalls = true;
    }
    for (const [label, pattern] of secretSignatures) {
      if (pattern.test(contents)) secretFindings.push(`${label} em ${path.slice(root.length + 1)}`);
    }
  }

  const finalName = clean(env.PICO_IOS_APP_NAME);
  const finalBundleId = clean(env.PICO_IOS_BUNDLE_ID);
  const finalTeamId = clean(env.PICO_IOS_TEAM_ID);
  const publicOrigin = clean(env.PICO_PUBLIC_ORIGIN);
  const supportContact = clean(env.PICO_PUBLIC_SUPPORT_EMAIL);
  const privacyContact = clean(env.PICO_PUBLIC_PRIVACY_EMAIL);
  const legalController = clean(env.PICO_LEGAL_CONTROLLER);
  const signingIdentity = clean(env.PICO_IOS_SIGNING_IDENTITY);
  const authAbuseControl = clean(env.PICO_AUTH_ABUSE_CONTROL);

  const packagedName = plistString(plist, 'CFBundleDisplayName') || clean(config?.appName);
  const projectBundleIds = buildSettingValues(project, 'PRODUCT_BUNDLE_IDENTIFIER');
  const projectTeamIds = buildSettingValues(project, 'DEVELOPMENT_TEAM');

  const checks = [
    oneCheck(
      'final-app-name',
      'Nome final do aplicativo',
      !isPlaceholder(finalName) && packagedName === finalName && clean(config?.appName) === finalName,
      !finalName
        ? 'Defina PICO_IOS_APP_NAME com a escolha humana e aplique o mesmo nome ao Info.plist e ao Capacitor.'
        : `Esperado “${finalName}”; pacote contém “${packagedName || 'ausente'}”.`,
      'human',
    ),
    oneCheck(
      'final-bundle-id',
      'Bundle ID final',
      /^[A-Za-z0-9][A-Za-z0-9.-]+$/.test(finalBundleId)
        && !isPlaceholder(finalBundleId)
        && projectBundleIds.length > 0
        && projectBundleIds.every((value) => value === finalBundleId)
        && clean(config?.appId) === finalBundleId,
      !finalBundleId
        ? 'Defina PICO_IOS_BUNDLE_ID depois de registrar o identificador na conta Apple.'
        : `Esperado ${finalBundleId}; projeto: ${projectBundleIds.join(', ') || 'ausente'}; Capacitor: ${clean(config?.appId) || 'ausente'}.`,
      'human',
    ),
    oneCheck(
      'apple-team',
      'Apple Developer Team',
      /^[A-Z0-9]{10}$/.test(finalTeamId)
        && projectTeamIds.length > 0
        && projectTeamIds.every((value) => value === finalTeamId),
      !finalTeamId
        ? 'Defina PICO_IOS_TEAM_ID após autenticação e aceite dos contratos Apple.'
        : `Team esperado ${finalTeamId}; projeto: ${projectTeamIds.join(', ') || 'ausente'}.`,
      'human',
    ),
    oneCheck(
      'public-domain',
      'Domínio público final',
      validHttpsOrigin(publicOrigin) && !isPlaceholder(publicOrigin),
      'Defina PICO_PUBLIC_ORIGIN como a origem HTTPS pública escolhida pelo responsável, sem caminho.',
      'human',
    ),
    oneCheck(
      'support-contact',
      'Contato público de suporte',
      validEmail(supportContact) && !isPlaceholder(supportContact),
      'Defina PICO_PUBLIC_SUPPORT_EMAIL com uma caixa pública acompanhada por uma pessoa.',
      'human',
    ),
    oneCheck(
      'privacy-contact',
      'Contato público de privacidade',
      validEmail(privacyContact) && !isPlaceholder(privacyContact),
      'Defina PICO_PUBLIC_PRIVACY_EMAIL com o canal aprovado pelo responsável.',
      'human',
    ),
    oneCheck(
      'legal-controller',
      'Identificação do controlador',
      !isPlaceholder(legalController),
      'Defina PICO_LEGAL_CONTROLLER somente após a identificação jurídica ser confirmada.',
      'human',
    ),
    oneCheck(
      'signing-identity',
      'Certificado Apple Distribution',
      /^(?:Apple|iPhone) Distribution:/.test(signingIdentity)
        && signingIdentities.includes(signingIdentity),
      !signingIdentity
        ? 'Defina PICO_IOS_SIGNING_IDENTITY com o certificado de distribuição instalado neste Mac.'
        : `A identidade “${signingIdentity}” não foi encontrada entre os certificados de assinatura disponíveis.`,
      'human',
    ),
    oneCheck(
      'auth-abuse-control',
      'Proteção do cadastro aberto',
      ['turnstile', 'controlled-admission'].includes(authAbuseControl),
      'Defina PICO_AUTH_ABUSE_CONTROL como turnstile após ativação coordenada no Supabase, ou controlled-admission após fechar o cadastro público. CORS e limites por conta não impedem criação automatizada de identidades.',
      'human',
    ),
    oneCheck(
      'remote-server-url',
      'Pacote local sem server.url',
      Boolean(config) && !config?.server?.url && config?.webDir === 'native-shell',
      config?.server?.url
        ? `Remova a URL remota ${config.server.url} e sincronize novamente o pacote local.`
        : 'capacitor.config.json precisa existir, usar native-shell e não conter server.url.',
    ),
    oneCheck(
      'release-user-agent',
      'User agent sem marcador de preview',
      config?.appendUserAgent === ' PicoNativeApp/1',
      `Use o marcador neutro “ PicoNativeApp/1”; encontrado “${config?.appendUserAgent || 'ausente'}”.`,
    ),
    oneCheck(
      'debug-logging',
      'Logs de debug ausentes',
      config?.loggingBehavior === 'none' && !debugCalls,
      config?.loggingBehavior !== 'none'
        ? `loggingBehavior está como ${config?.loggingBehavior || 'ausente'}.`
        : 'Remova console.log, console.debug, console.trace ou debugger do bundle Release.',
    ),
    oneCheck(
      'packaged-secrets',
      'Nenhum segredo conhecido no pacote',
      secretFindings.length === 0,
      secretFindings.length ? secretFindings.join('; ') : 'Nenhuma assinatura conhecida de segredo encontrada nos arquivos empacotados.',
    ),
    oneCheck(
      'local-web-bundle',
      'Bundle web local presente',
      /src="app\.js"/.test(publicIndex) && publicScript.length > 0 && publicStyles.length > 0,
      'Execute o build móvel e cap sync; index.html, app.js e app.css precisam estar no bundle iOS.',
    ),
    oneCheck(
      'privacy-manifest',
      'PrivacyInfo agregado e incluído no target',
      privacy.includes('NSPrivacyTracking')
        && privacy.includes('NSPrivacyAccessedAPICategoryUserDefaults')
        && privacy.includes('CA92.1')
        && privacy.includes('NSPrivacyAccessedAPICategoryFileTimestamp')
        && privacy.includes('C617.1')
        && privacy.includes('3B52.1')
        && /PrivacyInfo\.xcprivacy in Resources/.test(project),
      'Inclua o PrivacyInfo.xcprivacy agregado nos Resources do target App, com tracking, UserDefaults (CA92.1) e FileTimestamp (C617.1 e 3B52.1).',
    ),
    oneCheck(
      'archive-scheme',
      'Scheme compartilhado pronto para Release',
      scheme.includes('ArchiveAction')
        && /ArchiveAction[\s\S]*buildConfiguration = "Release"/.test(scheme),
      'Versione App.xcscheme e configure ArchiveAction para Release.',
    ),
  ];

  return {
    ready: checks.every((check) => check.ok),
    checks,
    summary: {
      passed: checks.filter((check) => check.ok).length,
      failed: checks.filter((check) => !check.ok).length,
      human: checks.filter((check) => !check.ok && check.kind === 'human').length,
      technical: checks.filter((check) => !check.ok && check.kind === 'technical').length,
    },
  };
}

function printReport(report) {
  process.stdout.write('Preflight de distribuição iOS do Pico Social\n');
  for (const check of report.checks) {
    const status = check.ok ? 'OK' : check.kind === 'human' ? 'PENDENTE' : 'FALHA';
    process.stdout.write(`${status.padEnd(8)} ${check.label}\n`);
    if (!check.ok) process.stdout.write(`         ${check.detail}\n`);
  }
  process.stdout.write(`\n${report.summary.passed}/${report.checks.length} checks concluídos; ${report.summary.human} gate(s) humano(s) e ${report.summary.technical} falha(s) técnica(s).\n`);
  if (!report.ready) {
    process.stdout.write('Nenhum archive, assinatura, upload ou alteração externa foi executado.\n');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const report = inspectIosRelease();
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else printReport(report);
  if (!report.ready) process.exitCode = 1;
}
