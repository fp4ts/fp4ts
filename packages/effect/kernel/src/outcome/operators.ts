// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Outcome, view } from './algebra';
import { canceled, failure, success } from './constructors';

export const fold: <F, E, A, B>(
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, [A]>) => B,
) => (oc: Outcome<F, E, A>) => B = (onCancel, onFailure, onSuccess) => oc =>
  fold_(oc, onCancel, onFailure, onSuccess);

// -- Point-ful operators

export const mapK_ = <F, G, E, A>(
  oc: Outcome<F, E, A>,
  nt: FunctionK<F, G>,
): Outcome<G, E, A> =>
  fold_(
    oc,
    () => canceled<G>(),
    e => failure<G, E>(e),
    fa => success<G, A>(nt(fa)),
  );

export const fold_ = <F, E, A, B1, B2 = B1, B3 = B2>(
  _oc: Outcome<F, E, A>,
  onCancel: () => B1,
  onFailure: (e: E) => B2,
  onSuccess: (fa: Kind<F, [A]>) => B3,
): B1 | B2 | B3 => {
  const oc = view(_oc);
  switch (oc.tag) {
    case 'success':
      return onSuccess(oc.result);
    case 'failure':
      return onFailure(oc.error);
    case 'canceled':
      return onCancel();
  }
};
