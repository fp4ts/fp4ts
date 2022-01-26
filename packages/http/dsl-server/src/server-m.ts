// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { EitherT, Monad } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http-core';
import { AddHeader } from './add-header';

export class ServerM<F> {
  public constructor(public readonly F: Monad<F>) {}

  public readonly addHeader =
    <H>(h: H) =>
    <A>(a: A): AddHeader<H, A> =>
      this.addHeader_(h, a);
  public readonly addHeader_ = <H, A>(h: H, a: A): AddHeader<H, A> =>
    new AddHeader(h, a);

  public readonly addHeaderF =
    <H>(h: H) =>
    <A>(fa: Kind<F, [A]>): Kind<F, [AddHeader<H, A>]> =>
      this.addHeaderF_(h, fa);
  public readonly addHeaderF_ = <H, A>(
    h: H,
    fa: Kind<F, [A]>,
  ): Kind<F, [AddHeader<H, A>]> => this.F.map_(fa, this.addHeader(h));

  public readonly addHeaderH =
    <H>(h: H) =>
    <A>(
      fa: EitherT<F, MessageFailure, A>,
    ): EitherT<F, MessageFailure, AddHeader<H, A>> =>
      this.addHeaderH_(h, fa);
  public readonly addHeaderH_ = <H, A>(
    h: H,
    fa: EitherT<F, MessageFailure, A>,
  ): EitherT<F, MessageFailure, AddHeader<H, A>> =>
    fa.map(this.F)(this.addHeader(h));

  public readonly return = <A>(a: A): EitherT<F, MessageFailure, A> =>
    EitherT.right(this.F)(a);

  public readonly liftF = <A>(
    fa: Kind<F, [A]>,
  ): EitherT<F, MessageFailure, A> => EitherT.rightT(this.F)(fa);

  public readonly unit: EitherT<F, MessageFailure, void> = EitherT.rightUnit(
    this.F,
  );

  public readonly throwError = <A = never>(
    failure: MessageFailure,
  ): EitherT<F, MessageFailure, A> => EitherT.left(this.F)(failure);
}
