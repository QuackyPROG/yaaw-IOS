---
name: yaaw-ios-release
description: Plan iOS release readiness, EAS build/test/signing steps, and App Store constraints.
---

# yaaw-ios-release

Invoke the canonical runtime first:

```text
node .yaaw-ios/system/engine/runtime.mjs --workspace . --invoke-skill yaaw-ios-release
```

Then use `.yaaw-ios/runtime/handoff.json` as the dispatch contract. Read only the named role document, listed artifact references, and selected modules needed for that handoff.

Do not reimplement workflow semantics in this skill. Canonical rules live in `.yaaw-ios/system/SYSTEM.md` and `kernel.yaml`.
