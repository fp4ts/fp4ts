import { Lazy } from '../fp/core';
import { PrimitiveType } from '../fp/primitive-type';

export interface Eq<A> {
  readonly equals: (lhs: A, rhs: A) => boolean;
  readonly notEquals: (lhs: A, rhs: A) => boolean;
}

// HKT

export const EqURI = 'cats/eq';
export type EqURI = typeof EqURI;

declare module '../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [EqURI]: Eq<Tys[0]>;
  }
}

// Instances

export const primitiveEq: Lazy<Eq<PrimitiveType>> = () => ({
  equals: (lhs, rhs) => lhs === rhs,
  notEquals: (lhs, rhs) => lhs !== rhs,
});
