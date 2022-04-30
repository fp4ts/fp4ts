// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { StrongLaws } from '@fp4ts/cats-laws';
import { Affine } from '@fp4ts/optics-kernel';
import { ProfunctorChoiceLaws } from './profunctor-choice-laws';

export const AffineLaws = <P>(P: Affine<P>) => ({
  ...ProfunctorChoiceLaws(P),
  ...StrongLaws(P),
});
