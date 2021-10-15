import { Kind } from './kind';
import { TyK, TyVar } from './ctor';
import { $fixed, $type } from './symbols';

export type Fix<X extends unknown = unknown> = [$fixed, X];
export declare const α: unique symbol;
export type α = typeof α;
export declare const β: unique symbol;
export type β = typeof β;

declare const $index: unique symbol;
export interface _<N extends number = 0> {
  [$index]: N;
}
export type _0 = _<0>;
export type _1 = _<1>;
export type _2 = _<2>;
export type _3 = _<3>;

type TyArg = Fix | α | β | _<number>;

// prettier-ignore
type ResolveTyVars<Ctx extends TyK, Vars extends unknown[]> =
  Vars extends [α, ...infer Rest]
    ? [TyVar<Ctx, 0>, ...ResolveTyVars<Ctx, Rest>]
  : Vars extends [β, ...infer Rest]
    ? [TyVar<Ctx, 1>, ...ResolveTyVars<Ctx, Rest>]
  : Vars extends [_<infer N>, ...infer Rest]
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
