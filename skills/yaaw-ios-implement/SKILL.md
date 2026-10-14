---
name: yaaw-ios-implement
description: Implement one admitted YAAW-iOS ticket and persist precise verification evidence.
---

# yaaw-ios-implement

Invoke the canonical runtime first:

```text
node .yaaw-ios/system/engine/runtime.mjs --workspace . --invoke-skill yaaw-ios-implement
```

Then use `.yaaw-ios/runtime/handoff.json` as the dispatch contract. Read only the named role document, listed artifact references, and selected modules needed for that handoff.

Do not reimplement workflow semantics in this skill. Canonical rules live in `.yaaw-ios/system/SYSTEM.md` and `kernel.yaml`.
