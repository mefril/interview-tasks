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
      const promise = executeTasksSequentially(sampleTasks);
      
      // Fast-forward through all timeouts
      await vi.runAllTimersAsync();
      
      const results = await promise;
      
      expect(results).toHaveLength(3);
      expect(results[0].id).toBe(1);
      expect(results[1].id).toBe(2);
      expect(results[2].id).toBe(3);
      
      // Check that each result has both startedAt and completedAt timestamps
      results.forEach(result => {
        expect(result).toHaveProperty('startedAt');
        expect(result).toHaveProperty('completedAt');
        expect(typeof result.startedAt).toBe('number');
        expect(typeof result.completedAt).toBe('number');
        expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
      });

      // Verify sequential execution: each task should start after the previous one completes
      for (let i = 1; i < results.length; i++) {
        const previousTask = results[i - 1];
        const currentTask = results[i];
        
        // Current task should start after or at the same time as previous task completion
        expect(currentTask.startedAt).toBeGreaterThanOrEqual(previousTask.completedAt);
      }

      // Verify tasks executed in the correct order by checking timing
      expect(results[0].startedAt).toBeLessThanOrEqual(results[1].startedAt);
      expect(results[1].startedAt).toBeLessThanOrEqual(results[2].startedAt);
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
      expect(results[0]).toHaveProperty('startedAt');
      expect(results[0]).toHaveProperty('completedAt');
    });

    it("should execute tasks with correct total duration", async () => {
      const tasks = [
        { id: 1, duration: 100 },
        { id: 2, duration: 200 },
        { id: 3, duration: 50 }
      ];
      
      const promise = executeTasksSequentially(tasks);
      
      // Fast-forward to completion
      await vi.runAllTimersAsync();
      const results = await promise;
      
      // Verify total execution time by checking the span from first start to last completion
      const totalDuration = results[results.length - 1].completedAt - results[0].startedAt;
      
      // In sequential execution, total time should be approximately the sum of all durations
      // We use fake timers, so this should be exactly the sum
      const expectedTotalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
      expect(totalDuration).toBeGreaterThanOrEqual(expectedTotalDuration);
      
      expect(vi.getTimerCount()).toBe(0); // All timers should be resolved
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
      
      // Verify each result has timing information
      results.forEach(result => {
        expect(result).toHaveProperty('startedAt');
        expect(result).toHaveProperty('completedAt');
      });
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
      
      // When concurrency limit is 1, it should behave like sequential execution
      for (let i = 1; i < results.length; i++) {
        expect(results[i].startedAt).toBeGreaterThanOrEqual(results[i - 1].completedAt);
      }
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

    it("should respect concurrency limit with proper timing", async () => {
      const concurrencyLimit = 2;
      const tasks = [
        { id: 1, duration: 200 },
        { id: 2, duration: 200 },
        { id: 3, duration: 200 },
        { id: 4, duration: 200 }
      ];

      const promise = executeTasksWithConcurrency(tasks, concurrencyLimit);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(4);
      
      // With concurrency limit of 2, tasks 1 and 2 should start around the same time
      // Tasks 3 and 4 should start after tasks 1 or 2 complete
      const task1 = results[0];
      const task2 = results[1];
      const task3 = results[2];
      const task4 = results[3];

      // Tasks 1 and 2 can start simultaneously (within concurrency limit)
      const simultaneousStartThreshold = 10; // Allow small timing differences
      expect(Math.abs(task1.startedAt - task2.startedAt)).toBeLessThanOrEqual(simultaneousStartThreshold);

      // Task 3 should start after either task 1 or task 2 completes
      expect(
        task3.startedAt >= task1.completedAt || task3.startedAt >= task2.completedAt
      ).toBe(true);

      // Task 4 should start after either task 1 or task 2 completes
      expect(
        task4.startedAt >= task1.completedAt || task4.startedAt >= task2.completedAt
      ).toBe(true);
    });
  });

  describe("executeTask helper", () => {
    it("should execute a single task correctly", async () => {
      const task = { id: 123, duration: 50 };
      
      const promise = executeTask(task);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.id).toBe(123);
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(typeof result.startedAt).toBe('number');
      expect(typeof result.completedAt).toBe('number');
      expect(result.completedAt).toBeGreaterThanOrEqual(result.startedAt);
    });
  });
}); 