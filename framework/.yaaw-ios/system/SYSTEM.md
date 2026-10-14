# YAAW-iOS system contract

YAAW-iOS is an artifact-first autonomous iOS engineering workflow optimized for Windows + Codex + Expo + EAS.

## Core rule

**Agents are disposable. Artifacts are durable.**

A fresh authority context must continue safely from the repository plus `.yaaw-ios/project/**`. Conversation history is never the only copy of an accepted decision.

## Authorities

- **Orchestrator** owns observation, deterministic routing, lifecycle reconciliation, recovery, and dispatch. It does not own product meaning, architecture, implementation, or acceptance.
- **ios-environment** owns factual host/device/build-channel readiness and explicitly authorized setup actions.
- **PRD** owns product meaning, user flows, product constraints, permission intent, supported devices, and accessibility intent.
- **ios-planner** owns repository discovery, Expo/React Native architecture, dependency/native boundary decisions, test/build/device strategy, and executable contracts.
- **Implementer** owns one admitted ticket, its application changes, tests, and implementation evidence.
- **Reviewer** owns independent `PASS`, `REPAIR`, `REPLAN`, or `BLOCKED`.

Roles define authority. Modules add expertise only; modules never grant authority.

## Durable truth

| Fact | Location |
| --- | --- |
| Product meaning | `.yaaw-ios/project/product.md` |
| Engineering decisions/readiness | `.yaaw-ios/project/engineering.md` |
| Environment conclusions | `.yaaw-ios/project/environment.json` |
| Device conclusions | `.yaaw-ios/project/device.json` |
| Bounded research | `.yaaw-ios/project/research/*` |
| Accepted implementation contracts | `.yaaw-ios/project/specs/*` |
| Work units and lifecycle | `.yaaw-ios/project/tickets/*` |
| Immutable implementation proof | `.yaaw-ios/project/evidence/*` |
| Immutable acceptance judgments | `.yaaw-ios/project/reviews/*` |
| Reusable project rules | `.yaaw-ios/project/rules/*` |

`.yaaw-ios/runtime/**` is replaceable. Deleting it must not delete product, engineering, ticket, evidence, or review truth.

## Execution layers

### WINDOWS_LOCAL

Allowed examples: code editing, JS/TS, lint/typecheck/unit/component tests, Expo Doctor, Metro, Git, EAS CLI, API tests, optional device diagnostics.

### EAS_MACOS_CLOUD

Use for Apple native-toolchain work: iOS binaries, signing, simulator builds, native dependency compilation, Maestro iOS simulator E2E, TestFlight/App Store-oriented builds.

### PHYSICAL_IPHONE

Use for real touch/keyboard/safe-area behavior, permissions, camera/microphone/sensors, Dynamic Type, VoiceOver, dark mode, background/foreground behavior, performance observations, and device-only failures.

Never claim `tested on iOS` when only Windows-local checks ran.

## macOS boundary

Windows does not provide Xcode, iOS Simulator, local XCUITest provisioning, or native LLDB/Xcode debugging.

An operation that requires Apple's native toolchain is `MACOS_REQUIRED`. Route it to EAS, GitHub Actions macOS, a configured remote Mac, or a human blocker. Do not fake it.

## Project discovery

Before app bootstrap classify the consumer repository as:

- `EMPTY_PROJECT`
- `EXISTING_EXPO_PROJECT`
- `EXISTING_REACT_NATIVE_PROJECT`
- `EXISTING_NATIVE_IOS_PROJECT`
- `EXISTING_CROSS_PLATFORM_PROJECT`
- `UNKNOWN`

Never run `create-expo-app` in an existing application merely because Expo is preferred.

## Expo policy

Default new-app strategy: TypeScript + Expo + Expo Router + development build + EAS.

Use `npx expo install` for Expo-compatible dependency versions. Prefer Continuous Native Generation/config plugins where appropriate. Do not cargo-cult state, networking, animation, styling, or backend libraries.

Expo Go is not production proof. Native modules/configuration/entitlements/capabilities require a development build or stronger native verification.

## Native-boundary classification

Every planned/implemented change that could affect native state must be classified:

- `JS_ONLY`
- `EXPO_MANAGED`
- `CONFIG_PLUGIN`
- `NATIVE_REBUILD_REQUIRED`
- `CUSTOM_NATIVE_MODULE`
- `MACOS_REQUIRED`
- `UNSUPPORTED_ON_CURRENT_HOST`

Avoid unnecessary EAS builds, but never reuse a stale native binary after native state changed.

## Apple design and accessibility

Prefer platform-standard navigation and controls when they produce the correct behavior. Liquid Glass is a navigation/control material layer, not a content-layer theme. Use it sparingly and respect reduced transparency, reduced motion, contrast, and readability.

Accessibility is acceptance scope when UI is touched: semantics, labels, reading/focus order, Dynamic Type, contrast, non-color-only meaning, motion/transparency settings, useful error states, keyboard/input behavior, and practical touch targets. Prefer stable accessibility/automation identifiers over coordinate-only automation.

## Evidence and review

Implementation evidence is immutable and names its execution environment. Reviewer inspects repository changes, accepted contract, tests, device/build/UI evidence, and exact repository identity where required.

Reviewer must run in a semantically fresh context from Implementer when the host supports it. Implementer prose is not acceptance evidence.

## Integrity

`.yaaw-ios/system/**` is package-owned. Semantic agents never edit it to unblock application work. Runtime verifies installer hashes and fails closed on missing/modified managed framework content.

Repair/update happens through the installer.

## Secrets

Never persist Apple ID passwords, cookies, private keys, App Store Connect secrets, EAS tokens, or other credential values in durable artifacts. Persist references to secret locations or required human actions, not secrets.
