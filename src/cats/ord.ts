import { Lazy } from '../fp/core';
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

export const URI = 'cats/ord';
export type URI = typeof URI;

declare module '../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Ord<A>;
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
