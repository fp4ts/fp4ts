import { IOFiber } from './io-fiber';

export interface ExecutionContext {
  readonly executeAsync: (thunk: () => void) => void;
  readonly executeFiber: (fiber: IOFiber<unknown>) => void;
  readonly sleep: (ms: number, thunk: () => void) => () => void;
  readonly currentTimeMillis: () => number;
}

export const GlobalExecutionContext: ExecutionContext = Object.freeze({
  executeAsync: thunk => setImmediate(thunk),
  executeFiber: fiber => setImmediate(() => fiber.run()),
  sleep: (ms, thunk) => {
    const ref = setTimeout(thunk, ms);
    return () => clearTimeout(ref);
  },
  currentTimeMillis: () => Date.now(),
});
