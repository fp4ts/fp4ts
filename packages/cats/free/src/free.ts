// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, HKT, id, Kind, lazy, TyK, TyVar } from '@fp4ts/core';
import { FunctionK, Monad, MonadDefer } from '@fp4ts/cats-core';
import { Left, Right } from '@fp4ts/cats-core/lib/data';

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

  private foldMapImpl<G>(G: Monad<G>, nt: FunctionK<F, G>): Kind<G, [A]> {
    return G.tailRecM(this as Free<F, A>)(_free => {
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
    return this.foldMap(F)(id);
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

// HKT

interface _Free<F, A> extends HKT<FreeF, [F, A]> {}

export interface FreeF extends TyK<[unknown, unknown]> {
  [$type]: Free<TyVar<this, 0>, TyVar<this, 1>>;
}
