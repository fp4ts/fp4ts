// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, HKT, id, Kind, lazy, TyK, TyVar } from '@fp4ts/core';
import { FunctionK, Monad, MonadDefer } from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';

export type Free<F, A> = _Free<F, A>;
export const Free: FreeObj = function <F, A>(a: A): Free<F, A> {
  return new Pure(a);
};

abstract class _Free<in out F, out A> {
  private readonly __void!: void;
  private readonly _F!: (f: F) => F;
  private readonly _A!: () => A;

  public map<B>(f: (a: A) => B): Free<F, B> {
    return this.flatMap(a => Free.pure(f(a)));
  }

  public flatMap<B>(f: (a: A) => Free<F, B>): Free<F, B> {
    return new FlatMap(this, f);
  }

  public foldMap<G>(G: Monad<G>): (nt: FunctionK<F, G>) => Kind<G, [A]> {
    return (nt: FunctionK<F, G>): Kind<G, [A]> => this.foldMapImpl(G, nt);
  }

  public runTailRec(F: Monad<F>): Kind<F, [A]> {
    return this.foldMapImpl(F, id);
  }

  private foldMapImpl<G>(G: Monad<G>, nt: FunctionK<F, G>): Kind<G, [A]> {
    const go = <A>(fv: Step<F, A>): Kind<G, [Either<Step<F, A>, A>]> =>
      fv.tag === 0
        ? G.pure(Right(fv.value))
        : fv.stack.isEmpty
        ? G.map_(nt(fv.value), Right as any)
        : G.map_(nt(fv.value), cc =>
            Left(fv.stack.head(cc).step(fv.stack.tail) as any),
          );
    return G.tailRecM_(this.step(Nil), go);
  }

  private step(stack: Cons<Frame<F>>): Step<F, A> {
    let _cur: Free<F, any> = this as any;
    while (true) {
      const cur = _cur as View<F, unknown>;
      switch (cur.tag) {
        case 0:
          if (stack.isEmpty)
            return { tag: 0, value: cur.value as A, stack: undefined };
          _cur = stack.head(cur.value);
          stack = stack.tail;
          continue;

        case 1:
          return { tag: 1, value: cur.fa, stack };

        case 2: {
          const self = cur.self as View<F, any>;
          const f = cur.f;

          switch (self.tag) {
            case 0:
              _cur = f(self.value);
              continue;

            case 1:
              return { tag: 1, value: self.fa, stack: Cons(f, stack) };

            default:
              stack = Cons(f, stack);
              _cur = self;
              continue;
          }
        }
      }
    }
  }
}

Free.pure = x => new Pure(x);
Free.suspend = fa => new Suspend(fa);

interface FreeObj {
  <F, A>(a: A): Free<F, A>;
  pure<F, A>(a: A): Free<F, A>;
  suspend<F, A>(a: Kind<F, [A]>): Free<F, A>;

  Monad<F>(): MonadDefer<$<FreeF, [F]>>;
}

class Pure<F, A> extends _Free<F, A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }
}

class Suspend<F, A> extends _Free<F, A> {
  public readonly tag = 1;
  public constructor(public readonly fa: Kind<F, [A]>) {
    super();
  }
}

class FlatMap<F, A, B> extends _Free<F, B> {
  public readonly tag = 2;
  public constructor(
    public readonly self: Free<F, A>,
    public readonly f: (a: A) => Free<F, B>,
  ) {
    super();
  }
}

type View<F, A> = Pure<F, A> | Suspend<F, A> | FlatMap<F, unknown, A>;

Free.Monad = lazy(<F>() =>
  MonadDefer.of<$<FreeF, [F]>>({
    pure: Free.pure,
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
  }),
) as <F>() => MonadDefer<$<FreeF, [F]>>;

// -- HKT

interface _Free<F, A> extends HKT<FreeF, [F, A]> {}

export interface FreeF extends TyK<[unknown, unknown]> {
  [$type]: Free<TyVar<this, 0>, TyVar<this, 1>>;
}

// -- Private implementation

type Frame<F> = (u: unknown) => Free<F, unknown>;

type Step<F, A> =
  | { tag: 0; value: A; stack: undefined }
  | { tag: 1; value: Kind<F, [unknown]>; stack: Cons<Frame<F>> };

export type Cons<A> = { isEmpty: boolean; head: A; tail: Cons<A> };
const Cons = <A>(head: A, tail: Cons<A>): Cons<A> => ({
  isEmpty: false,
  head,
  tail,
});
const Nil: Cons<never> = {
  isEmpty: true,
  head: undefined as any as never,
  tail: undefined as any,
};
