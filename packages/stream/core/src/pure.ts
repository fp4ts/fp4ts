import { $type, TyK } from '@fp4ts/core';

export type Pure<A> = never;

export interface PureK extends TyK<never> {
  [$type]: never;
}
