import { Lazy } from '../fp/core';
import { PrimitiveType } from '../fp/primitive-type';

export interface Show<A> {
  readonly show: (a: A) => string;
}

export const primitiveShow: Lazy<Show<PrimitiveType>> = () => ({
  show: x => `${x}`,
});

// HKT

export const URI = 'cats/show';
export type URI = typeof URI;

declare module '../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Show<A>;
  }
}
