import { $type, $variables } from './symbols';

export type TyVar<
  F extends TyK,
  X extends keyof F[$variables],
> = F[$variables][X];

export type TyK<Variables extends unknown[] = unknown[]> = {
  [$type]: unknown;
  [$variables]: Variables;
};
