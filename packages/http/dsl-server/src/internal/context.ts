export abstract class Context<A extends unknown[]> {
  public abstract fold<T>(
    onEmpty: () => T,
    onCons: <x, xs extends unknown[]>(x: x, xs: Context<xs>) => T,
  ): T;

  public concat<B extends unknown[]>(that: Context<B>): Context<[...A, ...B]> {
    return this.fold(
      () => that,
      (x, xs) => new ConsContext(x, xs['+++'](that)),
    );
  }
  public '+++'<B extends unknown[]>(that: Context<B>): Context<[...A, ...B]> {
    return this.concat(that);
  }
}

export class ConsContext<x, xs extends unknown[]> extends Context<[x, ...xs]> {
  public constructor(
    public readonly head: x,
    public readonly tail: Context<xs>,
  ) {
    super();
  }

  public fold<T>(
    onEmpty: () => T,
    onCons: <x, xs extends unknown[]>(x: x, xs: Context<xs>) => T,
  ): T {
    return onCons(this.head, this.tail);
  }
}

export const EmptyContext = new (class EmptyContext extends Context<[]> {
  public fold<T>(
    onEmpty: () => T,
    onCons: <x, xs extends unknown[]>(x: x, xs: Context<xs>) => T,
  ): T {
    return onEmpty();
  }
})();
export type EmptyContext = typeof EmptyContext;
