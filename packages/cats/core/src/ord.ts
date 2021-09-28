import { Lazy, PrimitiveType } from '@cats4ts/core';
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

export const Ord = Object.freeze({
  primitive: {
    ...Eq.primitive,
    compare: (lhs: PrimitiveType, rhs: PrimitiveType) =>
      lhs < rhs ? Compare.LT : lhs > rhs ? Compare.GT : Compare.EQ,
    lt: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs < rhs,
    lte: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs <= rhs,
    gt: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs > rhs,
    gte: (lhs: PrimitiveType, rhs: PrimitiveType) => lhs >= rhs,
  },
});

// HKT

export const OrdURI = 'cats/ord';
export type OrdURI = typeof OrdURI;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OrdURI]: Ord<Tys[0]>;
  }
}
