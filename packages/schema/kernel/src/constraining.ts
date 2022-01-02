// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Schemable, SchemableRequirements } from './schemable';

export interface Constraining<S> extends Schemable<S> {
  min(n: number): (sa: Kind<S, [number]>) => Kind<S, [number]>;
  min_(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;

  minExclusive(n: number): (sa: Kind<S, [number]>) => Kind<S, [number]>;
  minExclusive_(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;

  max(n: number): (sa: Kind<S, [number]>) => Kind<S, [number]>;
  max_(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;

  maxExclusive(n: number): (sa: Kind<S, [number]>) => Kind<S, [number]>;
  maxExclusive_(sa: Kind<S, [number]>, n: number): Kind<S, [number]>;

  nonEmpty(sa: Kind<S, [string]>): Kind<S, [string]>;
  nonEmpty<A>(sa: Kind<S, [A[]]>): Kind<S, [A[]]>;

  minLength(n: number): (sa: Kind<S, [string]>) => Kind<S, [string]>;
  minLength(n: number): <A>(sa: Kind<S, [A[]]>) => Kind<S, [A[]]>;
  minLength_(sa: Kind<S, [string]>, n: number): Kind<S, [string]>;
  minLength_<A>(sa: Kind<S, [A[]]>, n: number): Kind<S, [A[]]>;

  maxLength(n: number): (sa: Kind<S, [string]>) => Kind<S, [string]>;
  maxLength(n: number): <A>(sa: Kind<S, [A[]]>) => Kind<S, [A[]]>;
  maxLength_(sa: Kind<S, [string]>, n: number): Kind<S, [string]>;
  maxLength_<A>(sa: Kind<S, [A[]]>, n: number): Kind<S, [A[]]>;
}

export type ConstrainingRequirements<S> = Pick<
  Constraining<S>,
  | 'min_'
  | 'max_'
  | 'minExclusive_'
  | 'maxExclusive_'
  | 'nonEmpty'
  | 'minLength_'
  | 'maxLength_'
> &
  SchemableRequirements<S> &
  Partial<Constraining<S>>;
export const Constraining = Object.freeze({
  of: <S>(S: ConstrainingRequirements<S>): Constraining<S> => ({
    ...Schemable.of(S),
    min: n => sa => S.min_(sa, n),
    minExclusive: n => sa => S.minExclusive_(sa, n),
    max: n => sa => S.max_(sa, n),
    maxExclusive: n => sa => S.maxExclusive_(sa, n),

    minLength: n => (sa: any) => S.minLength_(sa, n),
    maxLength: n => (sa: any) => S.maxLength_(sa, n),
    ...S,
  }),
});
