// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { $, $type, id, Lazy, lazyVal, TyK, TyVar } from '@fp4ts/core';
import { Profunctor } from '../arrow';
import { EqK } from '../eq-k';
import { Monad } from '../monad';
import { Either } from './either';

export type Tagged<S, B> = _Tagged<S, B>;

export const Tagged: TaggedObj = function <S, B>(b: B): Tagged<S, B> {
  return new _Tagged(b);
};

Tagged.pure = Tagged;
Tagged.unTag = tsb => tsb.unTag;

class _Tagged<S, B> {
  private readonly _S!: (s: S) => void;

  public constructor(public readonly unTag: B) {}

  public retag<R>(): Tagged<R, B> {
    return this as any as Tagged<R, B>;
  }

  public dimap<R, C>(f: (r: R) => S, g: (b: B) => C): Tagged<R, C> {
    return new _Tagged(g(this.unTag));
  }

  public map<C>(g: (b: B) => C): Tagged<S, C> {
    return this.dimap(id, g);
  }

  public flatMap<R extends S, C>(g: (b: B) => Tagged<R, C>): Tagged<R, C> {
    return this.map(g).unTag;
  }

  public andThen<C, D>(that: Tagged<C, D>): Tagged<S, D> {
    return that.retag();
  }
}

interface TaggedObj {
  <S, B>(b: B): Tagged<S, B>;

  pure<S, B>(b: B): Tagged<S, B>;
  unTag<S, B>(tsb: Tagged<S, B>): B;

  // -- Instances

  EqK<S>(): EqK<$<TaggedF, [S]>>;
  Monad<S>(): Monad<$<TaggedF, [S]>>;
  Profunctor: Profunctor<TaggedF>;
}

// -- Instances

const taggedEqK: <S>() => EqK<$<TaggedF, [S]>> = lazyVal(<S>() =>
  EqK.of<$<TaggedF, [S]>>({
    liftEq: <A>(E: Eq<A>) => Eq.by(E, (ta: Tagged<S, A>) => ta.unTag),
  }),
) as <S>() => EqK<$<TaggedF, [S]>>;

const taggedMonad: <S>() => Monad<$<TaggedF, [S]>> = lazyVal(<S>() =>
  Monad.of<$<TaggedF, [S]>>({
    pure: Tagged,
    flatMap_: (fa, f) => fa.flatMap(f),
    map_: (fa, f) => fa.map(f),
    tailRecM_: <R, A>(
      r: R,
      f: (r: R) => Tagged<S, Either<R, A>>,
    ): Tagged<S, A> => {
      let res: Either<R, A> = f(r).unTag;
      while (res.isLeft) {
        res = f(res.getLeft).unTag;
      }
      return Tagged(res.get);
    },
  }),
) as <S>() => Monad<$<TaggedF, [S]>>;

const taggedProfunctor: Lazy<Profunctor<TaggedF>> = lazyVal(() =>
  Profunctor.of({ dimap_: (fab, f, g) => fab.dimap(f, g) }),
);

Tagged.EqK = taggedEqK;
Tagged.Monad = taggedMonad;
Tagged.Profunctor = taggedProfunctor();

// -- HKT

export interface TaggedF extends TyK<[unknown, unknown]> {
  [$type]: Tagged<TyVar<this, 0>, TyVar<this, 1>>;
}
