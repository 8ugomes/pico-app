# Apple: App Store Connect via asc

`asc` (rorkai) is the primary tool. Update it before serious submission work (`brew upgrade asc`), check auth with `asc auth doctor`, and use `--output json` for anything you'll parse. Auth is App Store Connect API key via env/profile: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY_PATH` (or `ASC_PRIVATE_KEY`/`_B64`), `ASC_APP_ID`. The `.p8` key is downloadable exactly once from App Store Connect — make sure the human stores it in a secret manager at creation time. Team keys require Account Holder or Admin to create, under Users and Access > Integrations > App Store Connect API. When the CLI lacks coverage, `asc schema` plus `asc auth token` give you a direct authenticated API path; check current Apple API docs before hand-rolling calls. `asc search` and `asc docs` answer command-discovery questions from the binary itself. For deep metadata, localization, screenshot, or pricing work, the CLI ships a companion skill pack (`rorkai/app-store-connect-cli-skills`) — register the skills you need in your skill manager (skillbox here) rather than installing them into an agent's global skills directory.

## Flow

```bash
asc apps list --bundle-id <bundle> --output json     # resolve app id
asc status --app <app-id> --include app,builds,testflight,appstore,submission,review
asc builds upload --app <app-id> --ipa <path>
asc builds wait --app <app-id> --latest              # upload succeeded ≠ build usable
asc validate --app <app-id> --version <version>
asc publish testflight --app <app-id>
asc publish appstore --app <app-id> --version <version> --submit --confirm
asc submit status --version-id <version-id>          # poll review state
```

Validate before publishing (`asc validate`; the old `asc submit preflight` is deprecated) — but not after: once submitted, `asc validate` flags the now-non-editable version as a blocking error, which is success wearing an error message; poll `asc submit status` instead. Duration flags want units (`--poll-interval 30s`, not `30`). Default flow is TestFlight first, then App Review when asked. A build's first distribution to an *external* TestFlight group triggers Beta App Review — a lighter, separate review with its own delay; internal groups need none. If `asc` upload fails, Transporter (which accepts the same API keys) and Xcode Organizer are the fallback upload paths — binary upload is not available via plain REST.

## Build

Ask the signing question before building: local certificates/profiles vs cloud (EAS) — don't guess. After Expo prebuild or any native regeneration, re-check entitlements and the build number; prebuild can silently reset them. Verify the exported IPA's bundle ID, version, and build number match what you intend before uploading. EAS specifics: cancelled or failed remote attempts still consume build numbers, and isolated archives silently drop git-ignored operator files (`eas.json`, Metro config) — read the final `CFBundleVersion` from the artifact, not from assumption, and confirm the archive carries the configs it needs. Local EAS builds also put signing secrets in child-process arguments, so never paste process listings into logs. Critical Alerts is its own Apple approval, separate from normal capability management (the capability API rejects it as a type) — after approval, regenerate the provisioning profile and verify the entitlement in the signed IPA. The App Store icon ships inside the binary's asset catalog (1024×1024, opaque) — changing only the icon still means a new build and version through review.

## Console boundary

`asc capabilities` prints the live coverage map — every capability tagged cli-supported / partial / experimental-web / not-public-api, with commands and next actions; trust it over any written list. The durable facts: agreements, tax, banking, identity, API-key creation, and role grants are account-owner-only. App record creation and the App Privacy questionnaire are web-only — `asc web apps create` and `asc web privacy` exist but the CLI itself labels them experimental and discouraged, so prefer browser automation or the human. App Privacy must be *published* before an App Review submission will go through.

## Readiness judgment points

The ones reviewers actually catch: account creation without in-app account deletion (hard rejection); third-party login without Sign in with Apple where required; vague permission purpose strings; App Privacy answers that don't match the SDKs actually compiled in; digital goods sold outside IAP; no working demo/reviewer access for gated features (give credentials and exact steps in review notes); UGC without report/block; screenshots showing states the reviewer can't reach.
