// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind, Lazy, lazy } from '@fp4ts/core';
import {
  Comonad,
  Distributive,
  Either,
  Function1F,
  Identity,
  IdentityF,
  Monad,
  Traversable,
} from '@fp4ts/cats';
import { ArrowApply, ArrowChoice, ArrowLoop } from '@fp4ts/cats-arrow';
import { Corepresentable, Representable, Closed } from '@fp4ts/cats-profunctor';

export interface Conjoined<P, RepF = unknown, CorepF = unknown>
  extends Representable<P, RepF>,
    Corepresentable<P, CorepF>,
    ArrowApply<P>,
    ArrowChoice<P>,
    ArrowLoop<P>,
    Closed<P> {
  readonly F: Distributive<RepF> & Monad<RepF>;
  readonly C: Traversable<CorepF> & Comonad<CorepF>;

  left<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<A, C>, Either<B, C>]>;
  right<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<C, A>, Either<C, B>]>;
}

export const Conjoined = Object.freeze({
  get Function1(): Conjoined<Function1F, IdentityF, IdentityF> {
    return function1Conjoined();
  },
});

// -- Instances

const function1Conjoined: Lazy<Conjoined<Function1F, IdentityF, IdentityF>> =
  lazy(() =>
    instance<Conjoined<Function1F, IdentityF, IdentityF>>({
      ...ArrowApply.Function1,
      ...ArrowChoice.Function1,
      ...ArrowLoop.Function1,
      ...Representable.Function1,
      ...Corepresentable.Function1,
      ...Closed.Function1,
      F: { ...Identity.Distributive, ...Identity.Monad },
      C: { ...Identity.Traversable, ...Identity.Comonad },
    }),
  );
