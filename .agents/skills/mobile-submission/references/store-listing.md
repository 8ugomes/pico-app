# Store listing guide

A store listing sells the app: the right person should recognize their problem, see how the app solves it, and believe it because every claim points to a real feature.

## Verify the product first

Before writing, check the submitted build and its source:

- Name, platforms, release state, and audience. Don't say "available now" if the listing isn't live yet.
- The problem and outcome. One sentence: when `<person>` hits `<problem>`, `<app>` uses `<mechanism>` so they can `<outcome>`.
- What a reviewer can reach from a clean install: auth, permissions, network needs, limits, paid paths, languages, account deletion.
- What data leaves the device, how long it's kept, and whether the user can delete it.
- Platform gaps, disabled features, unfinished flows. If the submitted build doesn't expose a feature, it doesn't go in the listing.

For existing apps, treat the live store as the source of truth for current copy and status; local docs only record decisions.

## One canonical draft

Keep the draft at `docs/store-listing.md` in the app repo. Read it before changing it, keep useful platform sections, and rewrite in place so it stays one coherent document. Shape:

```markdown
# <Product> store listing draft

<Platform or release-state note, if it changes how to read the draft.>

## Pre-submission blockers
- <Confirmed issue, consequence, required fix.>

## Title
<Product> — <specific outcome or use case>

## Short description
<One sentence: audience or pain + mechanism or outcome.>

## Google Play full description

## Apple App Store subtitle

## Apple App Store keywords

## Apple App Store promotional text

## Apple App Store description

## Google testing instructions
<Clean-install path, account needs, permissions, test data.>

## Apple review notes

## Claims deliberately avoided (keep it this way)
- <Claim and the factual reason it stays out.>
```

Drop sections for platforms that don't ship. Only add blockers that are real. A `TODO` for a missing value (e.g. review credentials) is fine, but never replace it with an invented claim or a secret.

## Positioning

Pick one primary user and one concrete moment — the missed alarm, the talk they can't follow. Open with that situation, then name the mechanism that makes the app different: "tracks drinks" is a category, "counts chai and coffee at water-equivalent values" is a reason to install. End with the outcome and a short invitation. Concrete nouns and verbs; no "seamless", "revolutionary", "powerful", "best".

## Fields

**Title:** `<Brand> — <outcome>`, em dash not colon (`Super Alarm — Scan to Wake Up`). Brand first, second half clear to a stranger. No keyword stuffing, no promises the app can't keep.

**Short description:** one readable sentence that adds information beyond the title. Check the current character limit before upload.

**Full description:** problem-led opening (2–3 short paragraphs), the core flow and its outcome, then feature groups under benefit headings ("Log in seconds", "Private by design") with evidence in bullets. State limits and trust facts that would affect a reasonable user's decision — connectivity, account requirements, retention, disclaimers. Close with the outcome, no guarantees.

**Apple fields:** subtitle is a compact category or outcome; keywords are truthful search terms only; promotional text reinforces the main reason to choose the app. Write a separate Apple description when the builds differ — never claim Android-only features on iOS.

**Review/testing notes:** shortest reliable path from a clean install: account needed or not, how to reach the main feature, which permissions and why, network needs, what data is sent. Credentials go through the authorized submission path, never in the doc.

## Claims discipline

Keep `Claims deliberately avoided` as a living list of claims that are false, unshipped, unverified, or easy for a reviewer to disprove. Recheck it whenever the build changes. Typical exclusions:

- Features that are future, disabled, stubbed, or platform-specific to another platform.
- "Free", "no ads", "unlimited", or pricing claims the current product doesn't establish.
- "Works offline", "on-device AI", "no data collected" — unless the actual auth, network, and storage paths prove the exact wording.
- Health, accuracy, financial, or safety guarantees the product can't substantiate.
- Availability, device, language, or integration claims that aren't in the release build.

Say what the app does and what the user can verify — nothing stronger.

## Final check

Before sending metadata to `asc` or `gplay`:

- Every field is within the current platform limit; title follows the em-dash convention.
- Pain point, mechanism, screenshots, and call to action describe the same product.
- Every claim is reachable or provable in the submitted build.
- Google and Apple copy agree, allowing for real platform differences.
- Testing instructions work from a clean install; sensitive values go through the authorized path.
- Blockers and avoided claims are explicit so a later agent doesn't mistake a draft for release-ready copy.

When the listing drives branded screenshots, pass the central promise and headlines to `mobile-screenshots` and follow that skill's workflow.
