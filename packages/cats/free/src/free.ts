// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, lazyVal, TyK, TyVar } from '@fp4ts/core';
import { FunctionK, Monad, StackSafeMonad } from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';

export type Free<F, A> = _Free<F, A>;
export const Free: FreeObj = function <F, A>(a: A): Free<F, A> {
  return new Pure(a);
};

abstract class _Free<F, out A> {
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
    return (nt: FunctionK<F, G>): Kind<G, [A]> =>
      G.tailRecM(this as Free<F, A>)(_free => {
        const free = _free.step as View<F, A>;
        switch (free.tag) {
          case 0:
            return G.pure(Right(free.value));
          case 1:
            return G.map_(nt(free.fa), Right);
          case 2:
            return G.map_(free.self.foldMap(G)(nt), cc => Left(free.f(cc)));
        }
      });
  }

  public runTailRec(F: Monad<F>): Kind<F, [A]> {
    return F.tailRecM(this as Free<F, A>)(
      (_rma: Free<F, A>): Kind<F, [Either<Free<F, A>, A>]> => {
        const rma = _rma as View<F, A>;
        switch (rma.tag) {
          case 0:
            return F.pure(Right(rma.value));
          case 1:
            return F.map_(rma.fa, Right);
          case 2: {
            const curr = rma.self as View<F, A>;
            switch (curr.tag) {
              case 0:
                return F.pure(Left(rma.f(curr.value)));
              case 1:
                return F.map_(curr.fa, x => Left(rma.f(x)));
              case 2:
                return F.pure(
                  Left(curr.self.flatMap(w => curr.f(w).flatMap(rma.f))),
                );
            }
          }
        }
      },
    );
  }

  private get step(): Free<F, A> {
    let _cur = this as Free<F, A>;
    while (true) {
      const cur = _cur as any as View<F, A>;
      switch (cur.tag) {
        case 0:
        case 1:
          return cur;

        case 2: {
          const self = cur.self as View<F, A>;
          switch (self.tag) {
            case 0:
              _cur = cur.f(self.value);
              continue;
            case 1:
              return cur;
            case 2:
              _cur = self.self.flatMap(cc => self.f(cc).flatMap(cur.f));
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

  Monad<F>(): Monad<$<FreeF, [F]>>;
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

Free.Monad = lazyVal(() =>
  StackSafeMonad.of({
    pure: Free.pure,
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
  }),
);

// HKT

export interface FreeF extends TyK<[unknown, unknown]> {
  [$type]: Free<TyVar<this, 0>, TyVar<this, 1>>;
}
