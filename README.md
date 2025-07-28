# Interview Tasks Repository

This repository contains multiple coding interview tasks, each in its own directory with implementation and test files.

## Structure

```
.codesandbox/
├── rateLimiter/
│   ├── rateLimiter.js      # Rate limiter implementation
│   └── rateLimiter.test.js # Rate limiter tests
└── increment/
    ├── increment.js        # Increment function implementation  
    └── increment.test.js   # Increment function tests
```

## Available Interview Tasks

### 1. Rate Limiter
Implement a function that creates a rate limiter allowing only a maximum number of calls in a sliding time window.

### 2. Increment Function  
Implement a function that creates an increment function using closures. The function should return the previous value + 1 on each call, without using global variables or external storage.

## Running Tests

- **Run all tests**: `yarn test`
- **Run rate limiter tests only**: `yarn test:rate-limiter`
- **Run increment tests only**: `yarn test:increment`
- **Run tests in watch mode**: `yarn test:watch`
- **Run specific task tests in watch mode**: `yarn test:watch:rate-limiter` or `yarn test:watch:increment`

## Adding New Interview Tasks

To add a new interview task:

1. Create a new directory under `.codesandbox/` (e.g., `.codesandbox/newTask/`)
2. Add implementation file: `newTask.js`
3. Add test file: `newTask.test.js`
4. Update `package.json` scripts to include:
   - `"test:new-task": "vitest .codesandbox/newTask"`
   - `"test:watch:new-task": "vitest .codesandbox/newTask --watch"`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [CodeSandbox — Docs](https://codesandbox.io/docs/learn)
- [CodeSandbox — Discord](https://discord.gg/Ggarp3pX5H)
