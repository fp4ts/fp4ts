import { $type, TyK } from '@cats4ts/core';

export type Pure<A> = never;

export interface PureK extends TyK<never> {
  [$type]: never;
}
