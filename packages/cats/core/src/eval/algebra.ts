import { id, Lazy, lazyVal } from '@fp4ts/core';
import { None, Option, Some } from '../data';
import { evaluate } from './evaluation';

export abstract class Eval<A> {
  private readonly __void!: void;

  public abstract readonly value: A;

  public abstract readonly memoize: Eval<A>;
}

export class Now<A> extends Eval<A> {
  public readonly tag = 'now';
  public constructor(public readonly value: A) {
    super();
  }

  public readonly memoize = this;
}

export class Later<A> extends Eval<A> {
  public readonly tag = 'later';
  public constructor(private thunk: () => A) {
    super();
  }

  private readonly _value: Lazy<A> = lazyVal(() => {
    const result = this.thunk();
    this.thunk = null as any;
    return result;
  });

  public get value(): A {
    return this._value();
  }

  public readonly memoize = this;
}

export class Always<A> extends Eval<A> {
  public readonly tag = 'always';
  public constructor(private readonly thunk: () => A) {
    super();
  }

  public get value(): A {
    return this.thunk();
  }

  public readonly memoize = new Later(this.thunk);
}

export class Defer<A> extends Eval<A> {
  public readonly tag = 'defer';
  public constructor(public readonly thunk: () => Eval<A>) {
    super();
  }

  public readonly memoize: Eval<A> = new Memoize(this);

  public get value(): A {
    return evaluate(this);
  }
}

export class FlatMap<E, A> extends Eval<A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: Eval<E>,
    public readonly run: (e: E) => Eval<A>,
  ) {
    super();
  }

  public readonly memoize: Eval<A> = new Memoize(this);
  public get value(): A {
    return evaluate(this);
  }
}

export class Memoize<A> extends Eval<A> {
  public readonly tag = 'memoize';
  public result: Option<A> = None;
  public constructor(public readonly self: Eval<A>) {
    super();
  }

  public readonly memoize = this;
  public get value(): A {
    return this.result.fold(() => {
      const a = evaluate(this);
      this.result = Some(a);
      return a;
    }, id);
  }
}

export type View<A> =
  | Now<A>
  | Later<A>
  | Always<A>
  | Defer<A>
  | FlatMap<any, A>
  | Memoize<A>;

export const view = <A>(_: Eval<A>): View<A> => _ as any;
