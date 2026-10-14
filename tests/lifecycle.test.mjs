import test from "node:test";
import assert from "node:assert/strict";
import { assertTransition, canTransition } from "../framework/.yaaw-ios/system/engine/lifecycle.mjs";

test("legal lifecycle transitions", () => {
  assert.equal(canTransition("READY", "IMPLEMENTING"), true);
  assert.equal(canTransition("REVIEW", "PASS"), true);
  assert.equal(canTransition("REVIEW", "REPAIR"), true);
});

test("illegal lifecycle transitions fail", () => {
  assert.equal(canTransition("DRAFT", "PASS"), false);
  assert.throws(() => assertTransition("IMPLEMENTING", "PASS"), /Illegal lifecycle transition/);
});
