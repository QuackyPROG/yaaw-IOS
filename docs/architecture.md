# YAAW-iOS v0.1 architecture

## Authority model

| Authority | Owns | Does not own |
| --- | --- | --- |
| Orchestrator | observe, route, reconcile, dispatch | product, architecture, implementation, acceptance |
| ios-environment | host/device/EAS capability facts and authorized setup | product features, app architecture |
| PRD | product intent, flows, permissions with product meaning, accessibility intent | engineering implementation |
| ios-planner | repo discovery, architecture, dependency/native boundary, build/test/device strategy | product invention, acceptance |
| Implementer | one admitted ticket, code/config/tests/evidence | approval |
| Reviewer | PASS/REPAIR/REPLAN/BLOCKED | implementation or contract ownership |

## Artifact model

```text
.yaaw-ios/project/
  product.md
  engineering.md
  environment.json
  device.json
  research/
  specs/
  tickets/
  evidence/
  reviews/
  rules/
```

Ticket status is ticket-local durable truth. Aggregate workflow status is derived.

## Lifecycle

```text
DRAFT -> READY -> IMPLEMENTING -> REVIEW
REVIEW -> PASS
REVIEW -> REPAIR -> IMPLEMENTING
REVIEW -> REPLAN -> DRAFT
any executable state -> BLOCKED
```

Planner owns contract-bearing transitions. Implementer evidence can authorize `IMPLEMENTING -> REVIEW`; Reviewer owns the semantic result; Orchestrator performs validated status reconciliation.

## Capability model

The environment doctor records observations using:

- `PASS`
- `WARNING`
- `ACTION_REQUIRED`
- `UNAVAILABLE_ON_WINDOWS`
- `OPTIONAL`

It never stores passwords, tokens, private keys, or authentication cookies.

## Native-boundary model

The classifier is conservative. App TS/JS/style/content changes are normally `JS_ONLY`. Native dependencies, config plugins, Info.plist/entitlement/capability changes and `ios/` changes escalate to a native rebuild or `MACOS_REQUIRED`.

A conservative false positive costs a build. A false negative can invalidate testing, so uncertain native signals escalate.

## Review evidence

Evidence must identify:

- ticket and revision;
- repository identity;
- verification environment;
- command/scenario;
- outcome;
- native-boundary classification;
- optional EAS build/device identifiers.

"tested on iOS" is not accepted as sufficient evidence.

## Framework integrity

`.yaaw-ios/system/**` is package-owned. `status` and runtime execution verify hashes from `.yaaw-ios/install/manifest.json`. Application agents do not edit package-owned system files to unblock app work.
