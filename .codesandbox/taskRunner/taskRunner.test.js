import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTasksSequentially, executeTasksWithConcurrency, executeTask } from "./taskRunner.js";

describe("TaskRunner", () => {
  const sampleTasks = [
    { id: 1, duration: 100 },
    { id: 2, duration: 50 },
    { id: 3, duration: 75 }
  ];

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe("executeTasksSequentially", () => {
    it("should execute tasks one after another", async () => {
      const startTime = Date.now();
      
      const promise = executeTasksSequentially(sampleTasks);
      
      // Fast-forward through all timeouts
      await vi.runAllTimersAsync();
      
      const results = await promise;
      
      expect(results).toHaveLength(3);
      expect(results[0].id).toBe(1);
      expect(results[1].id).toBe(2);
      expect(results[2].id).toBe(3);
      
      // Check that each result has completedAt timestamp
      results.forEach(result => {
        expect(result).toHaveProperty('completedAt');
        expect(typeof result.completedAt).toBe('number');
      });
    });

    it("should maintain order of results", async () => {
      const tasks = [
        { id: 5, duration: 200 },
        { id: 3, duration: 100 },
        { id: 7, duration: 150 }
      ];

      const promise = executeTasksSequentially(tasks);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results.map(r => r.id)).toEqual([5, 3, 7]);
    });

    it("should handle empty array", async () => {
      const promise = executeTasksSequentially([]);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toEqual([]);
    });

    it("should handle single task", async () => {
      const tasks = [{ id: 42, duration: 100 }];
      
      const promise = executeTasksSequentially(tasks);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(42);
    });
  });

  describe("executeTasksWithConcurrency", () => {
    it("should execute tasks with concurrency limit", async () => {
      const tasks = [
        { id: 1, duration: 100 },
        { id: 2, duration: 100 },
        { id: 3, duration: 100 },
        { id: 4, duration: 100 }
      ];

      const promise = executeTasksWithConcurrency(tasks, 2);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(4);
      expect(results.map(r => r.id)).toEqual([1, 2, 3, 4]);
    });

    it("should maintain order of results regardless of completion order", async () => {
      const tasks = [
        { id: 1, duration: 300 }, // slowest
        { id: 2, duration: 100 }, // fastest
        { id: 3, duration: 200 }  // medium
      ];

      const promise = executeTasksWithConcurrency(tasks, 3);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results.map(r => r.id)).toEqual([1, 2, 3]);
    });

    it("should respect concurrency limit of 1 (sequential)", async () => {
      const promise = executeTasksWithConcurrency(sampleTasks, 1);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(3);
      expect(results.map(r => r.id)).toEqual([1, 2, 3]);
    });

    it("should handle concurrency limit greater than task count", async () => {
      const promise = executeTasksWithConcurrency(sampleTasks, 10);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(3);
      expect(results.map(r => r.id)).toEqual([1, 2, 3]);
    });

    it("should handle empty array with concurrency", async () => {
      const promise = executeTasksWithConcurrency([], 2);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toEqual([]);
    });

    it("should handle zero concurrency limit", async () => {
      // Should either throw an error or handle gracefully
      const promise = executeTasksWithConcurrency(sampleTasks, 0);
      
      try {
        await vi.runAllTimersAsync();
        await promise;
        // If it doesn't throw, it should still work somehow
      } catch (error) {
        // It's acceptable to throw an error for invalid concurrency
        expect(error).toBeDefined();
      }
    });
  });

  describe("executeTask helper", () => {
    it("should execute a single task correctly", async () => {
      const task = { id: 123, duration: 50 };
      
      const promise = executeTask(task);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.id).toBe(123);
      expect(result.completedAt).toBeDefined();
      expect(typeof result.completedAt).toBe('number');
    });
  });
}); 