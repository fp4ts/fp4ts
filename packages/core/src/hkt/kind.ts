import { TyK } from './ctor';
import { Applied } from './lambda';
import { $type, $variables } from './symbols';

// prettier-ignore
export type Kind<F, Vars extends unknown[]> =
  F extends Applied<infer FF, infer AppliedVars>
    ? Kind<FF, [...AppliedVars, ...Vars]>
  : F extends TyK
    ? (F & { [$variables]: Vars })[$type]
  : F extends [infer Head]
    ? Kind<Head, Vars>
  : F extends [infer Head, ...infer Rest]
    ? Kind<Head, [Kind<Rest, Vars>]>
  : never;
