// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from './kind';
import { TyK, TyVar } from './ctor';
import { $fixed, $type } from './symbols';

export type Fix<X = unknown> = [$fixed, X];
export type α = _0 & { tag: never };
export type β = _1 & { tag: never };
export type γ = _2 & { tag: never };

declare const $index: unique symbol;
export interface _<N extends number = 0> {
  [$index]: N;
}
export type _0 = _<0>;
export type _1 = _<1>;
export type _2 = _<2>;
export type _3 = _<3>;

type TyArg = Fix | _<number>;

// prettier-ignore
type ResolveTyVars<Ctx extends TyK, Vars extends unknown[]> =
  Vars extends [_<infer N>, ...infer Rest]
    ? [TyVar<Ctx, N>, ...ResolveTyVars<Ctx, Rest>]
  : Vars extends [Fix<infer X>, ...infer Rest]
    ? [X, ...ResolveTyVars<Ctx, Rest>]
  : Vars extends []
    ? []
  : never;

export type Applied<F, Vars extends unknown[]> = {
  Fixed: {
    [$type]: F;
    [$fixed]: Vars;
  };
};

export type $<F, Vars extends unknown[]> = Applied<F, Vars>;

export interface $$<F, Vars extends TyArg[]> extends TyK {
  readonly [$type]: Kind<F, ResolveTyVars<this, Vars>>;
}

export type λ<F, Vars extends TyArg[]> = $$<F, Vars>;
