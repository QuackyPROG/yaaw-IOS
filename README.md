# YAAW-iOS

YAAW-iOS is an installable agentic engineering workflow for building iPhone applications from a primarily Windows environment using Codex, React Native, Expo, EAS, and a physical iPhone.

It is **not** an iOS app and it does **not** pretend Windows can run Xcode.

## What it automates

YAAW-iOS gives a consumer repository:

- durable product, engineering, environment, device, research, spec, ticket, evidence, and review artifacts;
- explicit authority roles for Orchestrator, Environment, PRD, Planner, Implementer, and Reviewer;
- iOS expertise modules for Apple design, Expo/React Native, navigation, accessibility, device diagnostics, EAS, testing, performance, privacy/security, and App Store concerns;
- environment and project discovery before scaffolding;
- native-boundary classification so JavaScript-only changes do not trigger needless EAS builds;
- honest Windows/EAS/physical-device capability separation;
- package integrity checks and update/repair-safe installation;
- project-local Codex worker configuration without replacing unrelated user configuration.

## Why Expo on Windows

Windows can edit, lint, typecheck, test JavaScript/TypeScript, run Metro, use Expo CLI, invoke EAS, and communicate with an iPhone through supported network/device paths. It cannot run the Apple native toolchain locally.

YAAW-iOS therefore uses three explicit execution layers:

| Layer | Typical work |
| --- | --- |
| Windows local | code, TS/JS tests, Expo Doctor, Metro, Git, EAS CLI, optional device diagnostics |
| EAS/macOS cloud | iOS native compilation, signing, simulator builds, Maestro E2E, store-oriented builds |
| Physical iPhone | real UX, permissions, sensors, safe areas, keyboard, accessibility, performance observations |

Any operation that truly needs Xcode/macOS is classified `MACOS_REQUIRED`.

## Current platform baseline

Research snapshot: **2026-10-15**.

- Expo SDK 57 is the stable Expo line; SDK 58 is beta.
- Expo SDK 57 uses React Native 0.86.
- Expo Router native tabs are still exposed through `expo-router/unstable-native-tabs` on SDK 57. The stable `expo-router/native-tabs` path starts with SDK 58.
- EAS can create iOS builds from any host OS; iOS compilation still happens on macOS infrastructure.
- EAS iOS **device** builds need Apple Developer Program signing credentials (or credentials already uploaded by an authorized team member). A free Apple developer account can test on a personal device through local Xcode, but Windows does not have that local-Xcode path.
- EAS Workflows supports iOS simulator builds and Maestro jobs; Maestro jobs are currently marked alpha by Expo.
- Expo Go is useful for limited early experimentation. Production-grade apps should normally move to a development build when native configuration or native libraries matter.

See [`docs/research-2026-10-15.md`](docs/research-2026-10-15.md).

## Install into a consumer project

From the package once published:

```text
npx yaaw-ios install .
```

For this repository during development:

```text
node bin/yaaw-ios.mjs install /path/to/project
```

Useful commands:

```text
npx yaaw-ios doctor .
npx yaaw-ios status .
npx yaaw-ios config .
npx yaaw-ios repair .
```

`install` and `repair` are idempotent. Package-managed files are hash tracked. Durable project memory is created only when missing and is not replaced during later installs.

## Public skills

The installer exposes thin Codex skills:

```text
$yaaw-ios-orchestrator
$yaaw-ios-setup
$yaaw-ios-prd
$yaaw-ios-planner
$yaaw-ios-implement
$yaaw-ios-review
$yaaw-ios-device-test
$yaaw-ios-release
```

They translate user intent into the canonical runtime under `.yaaw-ios/system/`; they do not duplicate the workflow.

## Physical iPhone workflow

The normal Windows path is:

```text
Windows/Codex
  -> local tests + Expo/Metro
  -> EAS development build when native state changes
  -> install/open development build on iPhone
  -> JS/TS iteration without rebuild while native state is unchanged
  -> manual or detected device evidence
  -> independent review
```

Optional Windows diagnostics can use `pymobiledevice3` or `go-ios` when installed. They are not mandatory and do not replace Xcode.

Direct autonomous UI automation of a physical iPhone is capability-gated. Mobile MCP/WebDriverAgent currently still requires WebDriverAgent to be provisioned through Xcode for the supported real-device workflow, so YAAW-iOS does not claim Windows-only WDA provisioning.

## What it cannot automate locally on Windows

- Xcode compilation
- local iOS Simulator
- local Swift/Objective-C native debugging with Xcode/LLDB
- first-party XCUITest provisioning
- Apple signing requirements
- guaranteed physical-device UI automation without an already-provisioned automation bridge

Where possible, YAAW-iOS routes these to EAS/macOS infrastructure. Otherwise it records a blocker or a human action.

## Repository layout

```text
framework/.yaaw-ios/system/   canonical installed framework
skills/                       canonical thin public skill sources
src/                          installer/doctor/status implementation
bin/yaaw-ios.mjs              CLI
tests/                        framework tests
docs/                         research and architecture decisions
```

Consumer installations use:

```text
.yaaw-ios/
  system/   package-owned
  project/  durable semantic truth
  runtime/  replaceable coordination
  install/  manifest/configuration
```

## Release scope

v0.1 targets Windows + Codex + Expo/React Native workflows. It deliberately does not try to be a Swift-only workflow, a local Xcode replacement, or a universal mobile automation stack.
