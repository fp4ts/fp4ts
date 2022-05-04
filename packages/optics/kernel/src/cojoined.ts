// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, instance, Kind, Lazy, lazyVal } from '@fp4ts/core';
import {
  ArrowApply,
  ArrowChoice,
  Comonad,
  Distributive,
  Either,
  Function1,
  Function1F,
  Identity,
  IdentityF,
  Monad,
  Traversable,
} from '@fp4ts/cats';
import { Closed } from './closed';
import { Corepresentable, Representable } from './representable';

export interface Cojoined<P, RepF = unknown, CorepF = unknown>
  extends Representable<P, RepF>,
    Corepresentable<P, CorepF>,
    ArrowApply<P>,
    ArrowChoice<P>,
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

export const Cojoined = Object.freeze({
  get Function1(): Cojoined<Function1F, IdentityF, IdentityF> {
    return function1Cojoined();
  },
});

// -- Instances

const function1Cojoined: Lazy<Cojoined<Function1F, IdentityF, IdentityF>> =
  lazyVal(() =>
    instance<Cojoined<Function1F, IdentityF, IdentityF>>({
      ...Function1.ArrowApply,
      ...Function1.ArrowChoice,
      ...Representable.Function1,
      ...Corepresentable.Function1,
      ...Closed.Function1,
      F: { ...Identity.Distributive, ...Identity.Monad },
      C: { ...Identity.Traversable, ...Identity.Comonad },
    }),
  );
