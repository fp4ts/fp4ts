export interface ExecutionContext {
  readonly executeAsync: (thunk: () => void) => void;
  readonly sleep: (ms: number, thunk: () => void) => () => void;
  readonly currentTimeMillis: () => number;
  readonly reportFailure: (e: Error) => void;
}

export const GlobalExecutionContext: ExecutionContext = Object.freeze({
  executeAsync: thunk => setImmediate(thunk),
  sleep: (ms, thunk) => {
    const ref = setTimeout(thunk, ms);
    return () => clearTimeout(ref);
  },
  currentTimeMillis: (): number => Date.now(),
  reportFailure: (e: Error): void => console.error(e),
});
