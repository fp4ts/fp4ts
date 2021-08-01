type ArgumentsType<F extends (...args: any[]) => any> = F extends (
  ...args: infer A
) => any
  ? A
  : never;

export declare interface Functional<F extends (...args: any[]) => any> {
  (...args: ArgumentsType<F>): ReturnType<F>;
}

export abstract class Functional<F extends (...args: any[]) => any> {
  public constructor(f: F) {
    const apply = function (
      this: Functional<F>,
      ...args: ArgumentsType<F>
    ): ReturnType<F> {
      return this.apply(f, args);
    };

    Object.setPrototypeOf(apply, this.constructor.prototype);
    for (const prop of Object.getOwnPropertyNames(this))
      Object.defineProperty(
        apply,
        prop,
        Object.getOwnPropertyDescriptor(this, prop)!,
      );

    return apply as Functional<F>;
  }
}
