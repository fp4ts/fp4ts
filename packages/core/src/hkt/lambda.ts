// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from './kind';
import { TyK, TyVar } from './ctor';
import { $fixed, $type, $variables } from './symbols';

export interface Fix<X = unknown> extends TyK {
  [$type]: X;
}
export type α = _<0> & { tag: never };
export type β = _<1> & { tag: never };
export type γ = _<2> & { tag: never };

export interface _<N extends number = 0> extends TyK {
  [$type]: TyVar<this, N>;
}

export type Applied<F, Vars extends unknown[]> = {
  Fixed: {
    [$type]: F;
    [$fixed]: Vars;
  };
};

export type $<F, Vars extends unknown[]> = Applied<F, Vars>;

export interface $$<F, Vars extends TyK[]> extends TyK {
  readonly [$type]: Kind<
    F,
    { [k in keyof Vars]: Kind<Vars[k], this[$variables]> }
  >;
}

export type λ<F, Vars extends TyK[]> = $$<F, Vars>;
