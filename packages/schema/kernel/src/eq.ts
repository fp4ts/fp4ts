/* eslint-disable @typescript-eslint/ban-types */
import { Array, Eq } from '@fp4ts/cats';
import { $type, Lazy, lazyVal, TyK, TyVar } from '@fp4ts/core';
import { Schemable } from './schemable';

export const eqSchemable: Lazy<Schemable<EqK>> = lazyVal(() =>
  Schemable.of({
    boolean: Eq.primitive,
    null: Eq.fromUniversalEquals(),
    string: Eq.primitive,
    defer: <A>(thunk: () => Eq<A>) =>
      Eq.of<A>({ equals: (x, y) => thunk().equals(x, y) }),
    literal: () => Eq.fromUniversalEquals(),
    array: Array.Eq,
    product: Eq.tuple as Schemable<EqK>['product'],
    struct: Eq.struct,
    sum:
      <T extends string>(tag: T) =>
      <A extends {}>(es: { [k in keyof A]: Eq<A[k] & Record<T, k>> }): Eq<
        A[keyof A]
      > =>
        Eq.of({
          equals: (l, r) => {
            const tl = l[tag as any as keyof typeof l];
            const rt = r[tag as any as keyof typeof r];
            if (tl !== rt) return false;
            return es[tl as any as keyof typeof es].equals(l as any, r as any);
          },
        }),
    nullable: <A>(e: Eq<A>) =>
      Eq.of<A | null>({
        equals: (l, r) => {
          if (l === r) return true;
          if (l === null) return false;
          if (r === null) return false;
          return e.equals(l, r);
        },
      }),

    number: Eq.primitive,
    record: Eq.record,
  }),
);

interface EqK extends TyK<[unknown]> {
  [$type]: Eq<TyVar<this, 0>>;
}
