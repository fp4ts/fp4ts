// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from './kind';
import { TyK, TyVar } from './ctor';
import { $fixed, $type, $variables } from './symbols';

export interface Fix<X = unknown> extends TyK {
  [$type]: X;
}
export type α = _0 & { tag: never };
export type β = _1 & { tag: never };
export type γ = _2 & { tag: never };

export interface _<N extends number = 0> extends TyK {
  [$type]: TyVar<this, N>;
}
export type _0 = _<0>;
export type _1 = _<1>;
export type _2 = _<2>;
export type _3 = _<3>;

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
