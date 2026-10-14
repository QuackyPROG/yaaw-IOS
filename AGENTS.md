# YAAW-iOS repository instructions

This repository implements YAAW-iOS itself. It is not an iOS application.

## Architecture invariants

- Agents are disposable. Artifacts are durable.
- Canonical consumer framework root is `.yaaw-ios/`; never reuse `.yaaw-core/`.
- Package-managed semantic logic lives in `.yaaw-ios/system/`.
- Durable consumer truth lives in `.yaaw-ios/project/`.
- Replaceable observations and handoffs live in `.yaaw-ios/runtime/`.
- Installer ownership and hashes live in `.yaaw-ios/install/`.
- Roles define authority. Modules add expertise and never grant authority.
- Root Codex session is the Orchestrator. Do not create a child Orchestrator.
- Implementer never self-approves. Reviewer must use a fresh semantic context when the host supports it.
- Windows does not run Xcode or the iOS Simulator. Native iOS compilation is `MACOS_REQUIRED` and normally delegated to EAS.
- Expo is the default application strategy, not a dogma. Inspect existing repositories before scaffolding.
- System files are package-owned and fail closed on integrity mismatch.
- Installer/update/repair never overwrite `.yaaw-ios/project/**` after initialization.
- Do not store credentials or secret values in durable artifacts.

## Change discipline

Changes to lifecycle, authority, schemas, installer ownership, evidence identity, Codex adapters, project detection, native-boundary classification, or environment capability detection must update tests and documentation together.

Run:

```text
npm test
npm run check
```
