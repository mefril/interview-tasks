import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./rateLimiter.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RateLimiter", () => {
  it("should allow only maxCalls in burst", () => {
    const max = 3;
    const called = [];
    const fn = createRateLimiter((x) => called.push(x), max, 1000);
    for (let i = 0; i < 10; i++) fn(i);
    expect(called.length).toBe(max);
  });

  it("should respect sliding window (edge case)", async () => {
    const max = 5;
    const interval = 1000;
    const called = [];

    const fn = createRateLimiter(
      (label, ts) => {
        called.push({ label, ts });
      },
      max,
      interval
    );

    const start = Date.now();

    for (let i = 0; i < max; i++) {
      await delay(900 + i * 10 - (Date.now() - start));
      fn("burst1", Date.now() - start);
    }

    for (let i = 0; i < max; i++) {
      await delay(1005 + i * 10 - (Date.now() - start));
      fn("burst2", Date.now() - start);
    }

    expect(called.length).toBeLessThanOrEqual(max);
  });
});
