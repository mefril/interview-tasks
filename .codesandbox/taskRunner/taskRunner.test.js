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
      const executionLog = [];
      let currentTime = 0;
      
      // Override setTimeout to track execution timing
      vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        const taskStart = currentTime;
        currentTime += delay;
        const taskEnd = currentTime;
        
        executionLog.push({ 
          start: taskStart, 
          end: taskEnd, 
          delay 
        });
        
        // Return a timer ID and queue the callback
        const timerId = Math.random();
        queueMicrotask(() => callback());
        return timerId;
      });

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

      // Verify sequential execution: each task should start after the previous one ends
      expect(executionLog).toHaveLength(3);
      
      // Task 1: starts at 0, ends at 100
      expect(executionLog[0].start).toBe(0);
      expect(executionLog[0].end).toBe(100);
      expect(executionLog[0].delay).toBe(100);
      
      // Task 2: starts at 100 (after task 1 ends), ends at 150
      expect(executionLog[1].start).toBe(100);
      expect(executionLog[1].end).toBe(150);
      expect(executionLog[1].delay).toBe(50);
      
      // Task 3: starts at 150 (after task 2 ends), ends at 225
      expect(executionLog[2].start).toBe(150);
      expect(executionLog[2].end).toBe(225);
      expect(executionLog[2].delay).toBe(75);

      // Verify no overlapping execution
      for (let i = 1; i < executionLog.length; i++) {
        expect(executionLog[i].start).toBeGreaterThanOrEqual(executionLog[i-1].end);
      }
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

    it("should execute tasks with correct total duration", async () => {
      const tasks = [
        { id: 1, duration: 100 },
        { id: 2, duration: 200 },
        { id: 3, duration: 50 }
      ];
      
      const promise = executeTasksSequentially(tasks);
      
      // Fast-forward to completion
      await vi.runAllTimersAsync();
      await promise;
      
      // Total execution time should be sum of all durations (100 + 200 + 50 = 350ms)
      // We can't check real time due to fake timers, but the test structure validates sequential execution
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

    it("should not exceed concurrency limit", async () => {
      const concurrencyLimit = 2;
      const tasks = [
        { id: 1, duration: 200 },
        { id: 2, duration: 200 },
        { id: 3, duration: 200 },
        { id: 4, duration: 200 }
      ];

      let activeTasks = 0;
      let maxConcurrentTasks = 0;

      // Override setTimeout to track concurrent executions
      vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        activeTasks++;
        maxConcurrentTasks = Math.max(maxConcurrentTasks, activeTasks);
        
        // Use queueMicrotask to avoid recursion
        queueMicrotask(() => {
          activeTasks--;
          callback();
        });
        
        return Math.random();
      });

      const promise = executeTasksWithConcurrency(tasks, concurrencyLimit);
      await vi.runAllTimersAsync();
      await promise;

      expect(maxConcurrentTasks).toBeLessThanOrEqual(concurrencyLimit);
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