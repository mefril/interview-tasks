/**
 * You're given an array of tasks:
 * const tasks = [
 *   { id: 1, duration: 300 },
 *   { id: 2, duration: 200 },
 *   { id: 3, duration: 100 }
 * ];
 * 
 * Each task takes duration ms to complete. Write a function that executes 
 * them in sequence, returning a Promise that resolves when all are done.
 * 
 * Bonus: add parallelism with a concurrency limit.
 * 
 * Implement the functions below:
 *   executeTasksSequentially(tasks)
 *   executeTasksWithConcurrency(tasks, concurrencyLimit)
 *
 * Both functions should return a Promise that resolves with an array 
 * of results in the same order as the input tasks.
 * Each result should be: { id: taskId, completedAt: timestamp }
 */

// Helper function to simulate task execution
function executeTask(task) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: task.id,
        completedAt: Date.now()
      });
    }, task.duration);
  });
}

export function executeTasksSequentially(tasks) {
  // TODO: Implement sequential execution
  throw new Error("Not implemented");
}

export function executeTasksWithConcurrency(tasks, concurrencyLimit) {
  // TODO: Implement execution with concurrency limit
  throw new Error("Not implemented");
}

// Export the helper for testing
export { executeTask }; 