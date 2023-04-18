// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, id, lazy, snd, throwError } from './function';
import { $type, HKT, TyK, TyVar } from './hkt';

/**
 * Eval is a stack-safe monad that provides _compositional_ laziness.
 *
 * Type `Eval<A>` describes a computation that yields a result of type `A` that
 * can be accessed using the getter `.value`. This is analogous to type `() => A`,
 * which however is not easily composed and does not provide stack safety.
 *
 * There are three strategies for creating an eval:
 *
 *  1. Now: evaluate the value eagerly (e.g., `Eval.now(42)`)
 *  2. Always: evaluate the value lazily _each time_ it is accessed (e.g., `Eval.always(() => 1 + 3)`)
 *  2. Later: evaluate the value lazily _only on it's first access_ (e.g., `Eval.later(() => 1 + 3)`)
 *
 * Eval supports stack-safe, lazy composition using .map/2 and .flatMap, which
 * are _always_ applied lazily, even when applied on `Now` instance.
 */
export abstract class Eval<out A> {
  public static readonly pure = <A>(x: A): Eval<A> => new Now(x);
  public static readonly now = Eval.pure;
  public static readonly unit: Eval<void> = null as any; /* defined below */
  public static readonly always = <A>(thunk: () => A): Eval<A> =>
    new Always(thunk);
  public static readonly later = <A>(thunk: () => A): Eval<A> =>
    new Later(thunk);
  public static readonly delay = Eval.later;
  public static readonly defer = <A>(thunk: () => Eval<A>): Eval<A> =>
    new Defer(thunk);

  public static readonly fix = <A>(f: (a: Eval<A>) => Eval<A>): Eval<A> => {
    const a: Eval<A> = Eval.defer(() => f(a));
    return a;
  };

  public static readonly void: Eval<void> = null as any /* defined below */;
  public static readonly false: Eval<boolean> = null as any /* defined below */;
  public static readonly true: Eval<boolean> = null as any /* defined below */;
  public static readonly zero: Eval<number> = null as any /* defined below */;
  public static readonly one: Eval<number> = null as any /* defined below */;
  public static readonly bottom = <A = never>(): Eval<A> => bottom;

  private readonly __void!: void;

  public get memoize(): Eval<A> {
    return new Memoize(this);
  }

  public get value(): A {
    return evaluate(this);
  }

  public map<B>(f: (a: A) => B): Eval<B> {
    return new Map(this, f);
  }

  public tap(f: (a: A) => void): Eval<A> {
    return this.map(x => (f(x), x));
  }

  public map2<B, C>(that: Eval<B>, f: (a: A, b: B) => C): Eval<C> {
    return new Map2(this, that, f);
  }

  public flatMap<B>(f: (a: A) => Eval<B>): Eval<B> {
    return new FlatMap(this, f);
  }

  public flatten<A>(this: Eval<Eval<A>>): Eval<A> {
    return this.flatMap(id);
  }

  public unzip<A, B>(this: Eval<readonly [A, B]>): [Eval<A>, Eval<B>] {
    const ac = this.memoize;
    return [ac.map(fst), ac.map(snd)];
  }

  public unzipWith<B, C>(f: (a: A) => readonly [B, C]): [Eval<B>, Eval<C>] {
    const ebc = this.map(f).memoize;
    return [ebc.map(fst), ebc.map(snd)];
  }

  public toString(): string {
    return 'Eval(..)';
  }
}

class Now<A> extends Eval<A> {
  public get tag(): 0 {
    return 0;
  }

  public constructor(public readonly _value: A) {
    super();
  }

  public override get value(): A {
    return this._value;
  }

  public override get memoize(): Eval<A> {
    return this;
  }
}

class Later<A> extends Eval<A> {
  public get tag(): 1 {
    return 1;
  }

  public constructor(thunk: () => A) {
    super();
    this._value = lazy(thunk);
  }

  private readonly _value: () => A;

  public override get value(): A {
    return this._value();
  }

  public override get memoize(): Eval<A> {
    return this;
  }
}

class Always<A> extends Eval<A> {
  public get tag(): 2 {
    return 2;
  }

  public constructor(private readonly thunk: () => A) {
    super();
  }

  public override get value(): A {
    return this.thunk();
  }

  public override get memoize(): Eval<A> {
    return new Later(this.thunk);
  }
}

class Defer<A> extends Eval<A> {
  public get tag(): 3 {
    return 3;
  }

  public constructor(public readonly thunk: () => Eval<A>) {
    super();
  }
}

class Map<E, A> extends Eval<A> {
  public get tag(): 4 {
    return 4;
  }

  public constructor(
    public readonly self: Eval<E>,
    public readonly run: (e: E) => A,
  ) {
    super();
  }
}

class FlatMap<E, A> extends Eval<A> {
  public get tag(): 5 {
    return 5;
  }

  public constructor(
    public readonly self: Eval<E>,
    public readonly run: (e: E) => Eval<A>,
  ) {
    super();
  }
}

class Memoize<A> extends Eval<A> {
  public get tag(): 6 {
    return 6;
  }

  public readonly result: DeferredValue<A> = {
    resolved: false,
    value: undefined,
  };

  public constructor(public readonly self: Eval<A>) {
    super();
  }

  public override get memoize() {
    return this;
  }

  public override get value(): A {
    return this.result.resolved ? this.result.value! : evaluate(this);
  }
}

class Map2<L, R, A> extends Eval<A> {
  public get tag(): 7 {
    return 7;
  }

  public constructor(
    public readonly lhs: Eval<L>,
    public readonly rhs: Eval<R>,
    public readonly f: (l: L, r: R) => A,
  ) {
    super();
  }
}

(Eval as any).unit = Eval.now(undefined);
(Eval as any).void = Eval.unit;
(Eval as any).false = Eval.now(false);
(Eval as any).true = Eval.now(true);
(Eval as any).zero = Eval.now(0);
(Eval as any).one = Eval.now(1);

const bottom = Eval.always(() => throwError(new Error('Eval.bottom')));

interface DeferredValue<A> {
  resolved: boolean;
  value?: A;
}

type View<A> =
  | Now<A>
  | Later<A>
  | Always<A>
  | Defer<A>
  | Map<any, A>
  | FlatMap<any, A>
  | Memoize<A>
  | Map2<any, any, A>;

enum Cont {
  DoneK = 0,
  MapK = 1,
  FlatMapK = 2,
  MemoizeK = 3,
  Map2LK = 4,
  Map2RK = 5,
}

function evaluate<A>(e: Eval<A>): A {
  const stack: unknown[] = [];
  const conts: Cont[] = [0];
  let _cur: Eval<unknown> = e;

  runLoop: while (true) {
    const cur = _cur as View<unknown>;
    let result: unknown;

    switch (cur.tag) {
      case 0: // Now
      case 1: // Later
      case 2: // Always
        result = cur.value;
        break;

      case 3: // Defer
        _cur = cur.thunk();
        continue;

      case 4: /* MapK */ {
        const self = cur.self as View<unknown>;
        const f = cur.run;

        switch (self.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            result = f(self.value);
            break;

          default:
            conts.push(Cont.MapK);
            stack.push(f);
            _cur = self;
            continue;
        }
        break;
      }

      case 5: /* FlatMap */ {
        const self = cur.self as View<unknown>;
        const f = cur.run;

        switch (self.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            _cur = f(self.value);
            continue;

          default:
            conts.push(Cont.FlatMapK);
            stack.push(f);
            _cur = self;
            continue;
        }
      }

      case 6: // Memoize
        if (cur.result.resolved) {
          result = cur.result.value!;
          break;
        }
        conts.push(Cont.MemoizeK);
        stack.push(cur.result);
        _cur = cur.self;
        continue;

      case 7: /* Map2 */ {
        const lhs = cur.lhs as View<unknown>;
        const rhs = cur.rhs as View<unknown>;
        const f = cur.f;

        switch (lhs.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            break;
          default:
            stack.push(f, rhs);
            conts.push(Cont.Map2LK);
            _cur = lhs;
            continue;
        }

        switch (rhs.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            result = f(lhs.value, rhs.value);
            break;
          default:
            stack.push(f, lhs.value);
            conts.push(Cont.Map2RK);
            _cur = rhs;
            continue;
        }
        break;
      }
    }

    while (true) {
      switch (conts.pop()!) {
        case 0: // EndK
          return result as A;
        case 1: /* MapK */ {
          const next = stack.pop()! as (u: unknown) => unknown;
          result = next(result);
          continue;
        }
        case 2: /* FlatMapK */ {
          const next = stack.pop()! as (u: unknown) => Eval<unknown>;
          _cur = next(result);
          continue runLoop;
        }
        case 3: /* MemoizeK */ {
          const deferred = stack.pop()! as any as DeferredValue<unknown>;
          deferred.resolved = true;
          deferred.value = result;
          continue;
        }

        case 4: /* Map2LR */ {
          const rhs = stack.pop()! as View<unknown>;
          switch (rhs.tag) {
            case 0: // Now
            case 1: // Later
            case 2: /* Always */ {
              const f = stack.pop()! as (l: unknown, r: unknown) => unknown;
              result = f(result, rhs.value);
              continue;
            }
            default:
              conts.push(Cont.Map2RK);
              stack.push(result);
              _cur = rhs;
              continue runLoop;
          }
        }

        case 5: /* Map2RK */ {
          const lhs = stack.pop()! as View<unknown>;
          const f = stack.pop()! as (l: unknown, r: unknown) => unknown;
          result = f(lhs, result);
          continue;
        }
      }
    }
  }
}

// -- HKT

export interface Eval<A> extends HKT<EvalF, [A]> {}

/**
 * @category Type Constructor
 */
export interface EvalF extends TyK<[unknown]> {
  [$type]: Eval<TyVar<this, 0>>;
}
