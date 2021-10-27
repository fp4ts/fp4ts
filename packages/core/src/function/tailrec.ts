type Arguments<F extends (...args: any[]) => any> = F extends (
  ...args: infer A
) => any
  ? A
  : never;

// https://gist.github.com/Gozala/1697037
// eslint-disable-next-line @typescript-eslint/ban-types
export function tailrec<F extends (...args: any[]) => any>(f: F): F {
  let result: ReturnType<F>;
  let running = false;
  const accumulated = [] as Arguments<F>[];

  const ff = function accumulator(
    this: ThisParameterType<F>,
    ...args: Arguments<F>
  ): any {
    accumulated.push(args);
    if (!running) {
      running = true;
      while (accumulated.length) result = f.apply(this, accumulated.shift()!);
      running = false;
      return result;
    }
  };

  return ff as F;
}
