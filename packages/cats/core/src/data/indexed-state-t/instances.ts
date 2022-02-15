// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, tupled, α, β, λ } from '@fp4ts/core';
import { Functor } from '../../functor';
import { Bifunctor } from '../../bifunctor';
import { Profunctor, Strong } from '../../arrow';
import { Contravariant } from '../../contravariant';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Either, Right, Left } from '../either';

import type { IndexedStateTF } from './index-state-t';
import { bimap_, contramap_, dimap_, flatMap_, map_, run_ } from './operators';
import { IndexedStateT } from './algebra';
import { liftF, pure } from './constructors';

export const indexedStateTFunctor: <F, SA, SB>(
  F: Functor<F>,
) => Functor<$<IndexedStateTF, [F, SA, SB]>> = F =>
  Functor.of({ map_: map_(F) });

export const indexedStateTContravariant: <F, SB, A>(
  F: Functor<F>,
) => Contravariant<λ<IndexedStateTF, [Fix<F>, α, Fix<SB>, Fix<A>]>> = F =>
  Contravariant.of({ contramap_: contramap_(F) });

export const indexedStateTBifunctor: <F, SA>(
  F: Functor<F>,
) => Bifunctor<$<IndexedStateTF, [F, SA]>> = F =>
  Bifunctor.of({ bimap_: bimap_(F) });

export const indexedStateTProfunctor: <F, V>(
  F: Functor<F>,
) => Profunctor<λ<IndexedStateTF, [Fix<F>, α, β, Fix<V>]>> = F =>
  Profunctor.of({ dimap_: dimap_(F) });

export const indexedStateTStrong: <F, V>(
  F: Monad<F>,
) => Strong<λ<IndexedStateTF, [Fix<F>, α, β, Fix<V>]>> = <F, V>(
  F: Monad<F>,
) => {
  const self = Strong.of<λ<IndexedStateTF, [Fix<F>, α, β, Fix<V>]>>({
    ...indexedStateTProfunctor(F),

    first: <A, B, C>(
      fab: IndexedStateT<F, A, B, V>,
    ): IndexedStateT<F, [A, C], [B, C], V> =>
      new IndexedStateT(
        F.pure(([a, c]: [A, C]) =>
          F.map_(run_(F)(fab, a), ([b, v]: [B, V]) => tupled(tupled(b, c), v)),
        ),
      ),

    second: <A, B, C>(
      fab: IndexedStateT<F, A, B, V>,
    ): IndexedStateT<F, [C, A], [C, B], V> =>
      dimap_(F)(
        self.first<A, B, C>(fab),
        ([c, a]) => tupled(a, c),
        ([b, c]) => tupled(c, b),
      ),
  });

  return self;
};

export const indexedStateTMonad: <F, S>(
  F: Monad<F>,
) => Monad<$<IndexedStateTF, [F, S, S]>> = <F, S>(F: Monad<F>) =>
  Monad.of<$<IndexedStateTF, [F, S, S]>>({
    ...indexedStateTFunctor(F),

    pure: pure(F),

    flatMap_: flatMap_(F),

    tailRecM_: <A, B>(
      a: A,
      f: (a: A) => IndexedStateT<F, S, S, Either<A, B>>,
    ): IndexedStateT<F, S, S, B> =>
      new IndexedStateT(
        F.pure((s: S) =>
          F.tailRecM<[S, A]>([s, a])<[S, B]>(([s, a]) =>
            F.map_(run_(F)(f(a), s), ([s, ea]) =>
              ea.fold(
                a => Left([s, a]),
                b => Right([s, b]),
              ),
            ),
          ),
        ),
      ),
  });

export const indexedStateTMonadError: <F, S, E>(
  F: MonadError<F, E>,
) => MonadError<$<IndexedStateTF, [F, S, S]>, E> = <F, S, E>(
  F: MonadError<F, E>,
) =>
  MonadError.of<$<IndexedStateTF, [F, S, S]>, E>({
    ...indexedStateTMonad<F, S>(F),

    throwError: e => liftF(F)(F.throwError(e)),

    handleErrorWith_: (fa, h) =>
      new IndexedStateT(
        F.pure(s => F.handleErrorWith_(run_(F)(fa, s), e => run_(F)(h(e), s))),
      ),
  });
