import { describe, it, expect } from "vitest";
import { createIncrement } from "./increment.js";

describe("Increment", () => {
  it("should return 1 on first call", () => {
    const increment = createIncrement();
    expect(increment()).toBe(1);
  });

  it("should increment by 1 on each subsequent call", () => {
    const increment = createIncrement();
    expect(increment()).toBe(1);
    expect(increment()).toBe(2);
    expect(increment()).toBe(3);
    expect(increment()).toBe(4);
    expect(increment()).toBe(5);
  });

  it("should work with multiple independent incrementers", () => {
    const increment1 = createIncrement();
    const increment2 = createIncrement();
    
    expect(increment1()).toBe(1);
    expect(increment1()).toBe(2);
    
    expect(increment2()).toBe(1);
    expect(increment2()).toBe(2);
    
    expect(increment1()).toBe(3);
    expect(increment2()).toBe(3);
  });

  it("should maintain state across many calls", () => {
    const increment = createIncrement();
    
    // Call it 100 times
    for (let i = 1; i <= 100; i++) {
      expect(increment()).toBe(i);
    }
  });

  it("should return a function when called", () => {
    const increment = createIncrement();
    expect(typeof increment).toBe("function");
  });

  it("should not interfere between different instances created at different times", () => {
    const increment1 = createIncrement();
    
    expect(increment1()).toBe(1);
    expect(increment1()).toBe(2);
    
    const increment2 = createIncrement();
    
    expect(increment2()).toBe(1); // Should start fresh
    expect(increment1()).toBe(3); // Should continue from where it left off
    expect(increment2()).toBe(2);
  });
}); 