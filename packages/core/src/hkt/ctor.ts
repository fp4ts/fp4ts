// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, $variables } from './symbols';

export type TyVar<
  F extends TyK,
  X extends keyof F[$variables],
> = F[$variables][X];

export type TyK<Variables extends unknown[] = unknown[]> = {
  [$type]: unknown;
  [$variables]: Variables;
  Fixed: never;
};
