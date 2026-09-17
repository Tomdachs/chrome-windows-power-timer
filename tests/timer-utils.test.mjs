import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRemaining,
  isAction,
  splitMinutes,
  toTotalMinutes
} from "../extension/timer-utils.js";

test("toTotalMinutes accepts one-minute increments", () => {
  assert.equal(toTotalMinutes(0, 1), 1);
  assert.equal(toTotalMinutes(1, 22), 82);
  assert.equal(toTotalMinutes(168, 0), 10080);
});

test("toTotalMinutes rejects invalid ranges", () => {
  assert.throws(() => toTotalMinutes(0, 0));
  assert.throws(() => toTotalMinutes(0, 60));
  assert.throws(() => toTotalMinutes(-1, 0));
});

test("splitMinutes normalizes presets", () => {
  assert.deepEqual(splitMinutes(60), { hours: 1, minutes: 0 });
  assert.deepEqual(splitMinutes(125), { hours: 2, minutes: 5 });
});

test("power actions are allow-listed", () => {
  assert.equal(isAction("sleep"), true);
  assert.equal(isAction("shutdown"), true);
  assert.equal(isAction("restart"), false);
});

test("formatRemaining renders countdown", () => {
  assert.equal(formatRemaining(61_000, 0), "1:01");
  assert.equal(formatRemaining(3_661_000, 0), "1:01:01");
});
