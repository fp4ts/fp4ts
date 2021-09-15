import { Lazy } from '../core';
import { PrimitiveType } from '../fp/primitive-type';
import { Eq, primitiveEq } from './eq';

export enum Compare {
  LT,
  GT,
  EQ,
}

export interface Ord<A> extends Eq<A> {
  readonly compare: (lhs: A, rhs: A) => Compare;
  readonly lt: (lhs: A, rhs: A) => boolean;
  readonly lte: (lhs: A, rhs: A) => boolean;
  readonly gt: (lhs: A, rhs: A) => boolean;
  readonly gte: (lhs: A, rhs: A) => boolean;
}

// HKT

export const OrdURI = 'cats/ord';
export type OrdURI = typeof OrdURI;

declare module '../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OrdURI]: Ord<Tys[0]>;
  }
}

export const primitiveOrd: Lazy<Ord<PrimitiveType>> = () => ({
  ...primitiveEq(),
  compare: (lhs, rhs) =>
    lhs < rhs ? Compare.LT : lhs > rhs ? Compare.GT : Compare.EQ,
  lt: (lhs, rhs) => lhs < rhs,
  lte: (lhs, rhs) => lhs <= rhs,
  gt: (lhs, rhs) => lhs > rhs,
  gte: (lhs, rhs) => lhs >= rhs,
});
