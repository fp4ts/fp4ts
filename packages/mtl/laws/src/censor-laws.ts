// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Censor } from '@fp4ts/mtl-core';
import { ListenLaws } from './listen-laws';

export const CensorLaws = <F, W>(F: Censor<F, W>) => ({
  ...ListenLaws(F),

  tellRightProductHomomorphism: (l: W, r: W): IsEq<Kind<F, [void]>> =>
    new IsEq(
      F.productR_(F.tell(l), F.tell(r)),
      F.tell(F.monoid.combine_(l, r)),
    ),

  tellLeftProductHomomorphism: (l: W, r: W): IsEq<Kind<F, [void]>> =>
    new IsEq(
      F.productL_(F.tell(l), F.tell(r)),
      F.tell(F.monoid.combine_(l, r)),
    ),

  censorWithPureIsEmptyTell: <A>(a: A, f: (w: W) => W): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.censor_(F.pure(a), f),
      F.map_(F.tell(f(F.monoid.empty)), () => a),
    ),

  clearIsIdempotent: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.clear(F.clear(fa)), F.clear(fa)),

  tellAndClearIsPureUnit: (w: W): IsEq<Kind<F, [void]>> =>
    new IsEq(F.clear(F.tell(w)), F.unit),
});
