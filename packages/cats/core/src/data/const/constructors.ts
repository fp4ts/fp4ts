import { Monoid } from '../../monoid';

import { Const } from './const';

export const of = <A, B>(a: A): Const<A, B> => a;

export const pure =
  <A>(A: Monoid<A>) =>
  <B>(_: B): Const<A, B> =>
    A.empty;

export const empty = <A>(A: Monoid<A>): Const<A, never> => A.empty;
