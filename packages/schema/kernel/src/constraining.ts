import { Kind } from '@fp4ts/core';
import { Schemable } from './schemable';

export interface Constraining<S> extends Schemable<S> {
  min(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;
  minExclusive(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;
  max(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;
  maxExclusive(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;

  nonEmpty(sa: Kind<S, [string]>): Kind<S, [string]>;
  nonEmpty<A>(sa: Kind<S, [A[]]>): Kind<S, [A[]]>;

  minLength(sa: Kind<S, [string]>, n: number): Kind<S, [string]>;
  minLength<A>(sa: Kind<S, [A[]]>, n: number): Kind<S, [A[]]>;

  maxLength(sa: Kind<S, [string]>, n: number): Kind<S, [string]>;
  maxLength<A>(sa: Kind<S, [A[]]>, n: number): Kind<S, [A[]]>;
}
