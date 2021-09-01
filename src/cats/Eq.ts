import { Lazy } from '../fp/core';
import { PrimitiveType } from '../fp/primitive-type';

export interface Eq<A> {
  readonly equals: (lhs: A, rhs: A) => boolean;
  readonly notEquals: (lhs: A, rhs: A) => boolean;
}

// HKT

export const URI = 'cats/eq';
export type URI = typeof URI;

declare module '../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Eq<A>;
  }
}

// Instances

export const primitiveEq: Lazy<Eq<PrimitiveType>> = () => ({
  equals: (lhs, rhs) => lhs === rhs,
  notEquals: (lhs, rhs) => lhs !== rhs,
});
