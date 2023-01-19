// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { StrongLaws } from '@fp4ts/cats-laws';
import { Affine } from '@fp4ts/optics-kernel';
import { ChoiceLaws } from './choice-laws';

export const AffineLaws = <P>(P: Affine<P>) => ({
  ...ChoiceLaws(P),
  ...StrongLaws(P),
});
