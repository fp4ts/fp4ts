import { Param } from './fix';

export type Variance = '+' | '-' | '#';

export interface V<F extends Param, V extends Variance> {
  Variance: {
    [v in V]: F;
  };
}

export type Mix<
  C,
  P extends Param,
  X extends [unknown, ...unknown[]],
> = C extends V<P, '#'>
  ? X[0]
  : C extends V<P, '+'>
  ? // X[0] | X[1] | ...
    X[number]
  : C extends V<P, '-'>
  ? C extends [any]
    ? X[0]
    : C extends [any, any]
    ? X[0] & X[1]
    : X extends [any, any]
    ? X[0] & X[1]
    : X extends [any, any, any]
    ? X[0] & X[1] & X[2]
    : X extends [any, any, any, any]
    ? X[0] & X[1] & X[2] & X[3]
    : X extends [any, any, any, any, any]
    ? X[0] & X[1] & X[2] & X[3] & X[4]
    : X extends [any, any, any, any, any, any]
    ? X[0] & X[1] & X[2] & X[3] & X[4] & X[5]
    : X extends [any, any, any, any, any, any, any]
    ? X[0] & X[1] & X[2] & X[3] & X[4] & X[5] & X[6]
    : X extends [any, any, any, any, any, any, any, any]
    ? X[0] & X[1] & X[2] & X[3] & X[4] & X[5] & X[6] & X[7]
    : // X[0] & X[1] & ...
      UnionToIntersection<{ [k in keyof X]: OrNever<X[k]> }[number]>
  : X[0];

type OrNever<K> = unknown extends K ? never : K;

export type Intro<C, P extends Param, Fixed, Current> = C extends V<P, '#'>
  ? Fixed
  : C extends V<P, '+'>
  ? Current
  : C extends V<P, '-'>
  ? Current
  : Fixed;

export type Empty<C, P extends Param> = C extends V<P, '+'> ? never : unknown;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
