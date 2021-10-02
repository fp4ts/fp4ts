import { Lazy, PrimitiveType } from '@cats4ts/core';

export interface Eq<A> {
  readonly equals: (lhs: A, rhs: A) => boolean;
  readonly notEquals: (lhs: A, rhs: A) => boolean;
}

export type EqRequirements<A> = Pick<Eq<A>, 'equals'> & Partial<Eq<A>>;
export const Eq = Object.freeze({
  of: <A>(E: EqRequirements<A>): Eq<A> => ({
    notEquals: (a, b) => !E.equals(a, b),
    ...E,
  }),

  by: <A, B>(E: Eq<B>, f: (a: A) => B): Eq<A> =>
    Eq.of<A>({
      equals: (a, b) => E.equals(f(a), f(b)),
    }),

  get primitive(): Eq<PrimitiveType> {
    return primitiveEq();
  },

  get void(): Eq<void> {
    return Eq.of({ equals: () => true });
  },

  get never(): Eq<never> {
    return Eq.of({ equals: () => false });
  },

  Error: {
    get allEqual(): Eq<Error> {
      return Eq.of({ equals: () => true });
    },
    get strict(): Eq<Error> {
      return Eq.of({
        equals: (lhs, rhs) => {
          if (lhs === rhs) return true;
          if (lhs.constructor !== rhs.constructor) return false;
          if (lhs.message !== rhs.message) return false;
          return true;
        },
      });
    },
  },
});

// HKT

export const EqURI = 'cats/eq';
export type EqURI = typeof EqURI;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [EqURI]: Eq<Tys[0]>;
  }
}

// Instances

export const primitiveEq: Lazy<Eq<PrimitiveType>> = () => ({
  equals: (lhs, rhs) => lhs === rhs,
  notEquals: (lhs, rhs) => lhs !== rhs,
});
