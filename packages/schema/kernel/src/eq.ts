// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Eval, Lazy, lazyVal } from '@fp4ts/core';
import { Array, Eq, EqF } from '@fp4ts/cats';
import { Schemable } from './schemable';

export const eqSchemable: Lazy<Schemable<EqF>> = lazyVal(() =>
  Schemable.of({
    boolean: Eq.fromUniversalEquals(),
    null: Eq.fromUniversalEquals(),
    number: Eq.fromUniversalEquals(),
    string: Eq.fromUniversalEquals(),
    literal: () => Eq.fromUniversalEquals(),
    array: <A>(E: Eq<A>) =>
      SafeEq.of<A[]>({
        safeEquals: (x, y) => Eval.defer(() => safeEquals(Array.Eq(E), x, y)),
      }),
    product: productSafeEq as Schemable<EqF>['product'],
    struct: structSafeEq,
    sum: sumSafeEq,
    nullable: <A>(E: Eq<A>) =>
      SafeEq.of<A | null>({
        safeEquals: (l, r) => {
          if (l === r) return Eval.true;
          if (l === null) return Eval.false;
          if (r === null) return Eval.false;
          return Eval.defer(() => safeEquals(E, l, r));
        },
      }),

    optional: <A>(E: Eq<A>): Eq<A | undefined> =>
      SafeEq.of<A | undefined>({
        safeEquals: (l: A | undefined, r: A | undefined) => {
          if (l === r) return Eval.true;
          if (l === undefined) return Eval.false;
          if (r === undefined) return Eval.false;
          return Eval.defer(() => safeEquals(E, l, r));
        },
      }),

    record: <A>(E: Eq<A>): Eq<Record<string, A>> =>
      SafeEq.of({
        safeEquals: (x, y) => {
          for (const k in x) {
            if (!(k in y)) return Eval.false;
          }
          for (const k in y) {
            if (!(k in x)) return Eval.false;
          }
          const keys = Object.keys(x);
          const loop = (idx: number): Eval<boolean> =>
            idx >= keys.length
              ? Eval.true
              : Eval.defer(() =>
                  safeEquals(E, x[keys[idx]], y[keys[idx]]).flatMap(eq =>
                    eq ? loop(idx + 1) : Eval.false,
                  ),
                );

          return loop(0);
        },
      }),

    imap: imapSafeEq,

    defer: deferSafeEq,
  }),
);

export const productSafeEq = <A extends unknown[]>(
  ...fs: { [k in keyof A]: Eq<A[k]> }
): SafeEq<A> =>
  SafeEq.of({
    safeEquals: (x, y) => {
      const loop = (idx: number): Eval<boolean> =>
        idx >= fs.length
          ? Eval.true
          : Eval.defer(() =>
              safeEquals(fs[idx], x[idx], y[idx]).flatMap(eq =>
                eq ? loop(idx + 1) : Eval.false,
              ),
            );

      return loop(0);
    },
  });

export const structSafeEq = <A extends {}>(fs: {
  [k in keyof A]: Eq<A[k]>;
}): SafeEq<A> => {
  const keys = Object.keys(fs) as (keyof A)[];
  return SafeEq.of({
    safeEquals: (x, y) => {
      const loop = (idx: number): Eval<boolean> =>
        idx >= keys.length
          ? Eval.true
          : Eval.defer(() =>
              safeEquals(fs[keys[idx]], x[keys[idx]], y[keys[idx]]).flatMap(
                eq => (eq ? loop(idx + 1) : Eval.false),
              ),
            );

      return loop(0);
    },
  });
};

export const sumSafeEq =
  <T extends string>(tag: T) =>
  <A extends {}>(es: { [k in keyof A]: Eq<A[k] & Record<T, k>> }): SafeEq<
    A[keyof A]
  > =>
    SafeEq.of({
      safeEquals: (l, r) => {
        const tl = l[tag as any as keyof typeof l];
        const rt = r[tag as any as keyof typeof r];
        if (tl !== rt) return Eval.false;
        const E = es[tl as any as keyof A];
        return safeEquals(E, l as any, r as any);
      },
    });

export const imapSafeEq = <A, B>(
  E: Eq<A>,
  f: (a: A) => B,
  g: (b: B) => A,
): SafeEq<B> =>
  SafeEq.of<B>({
    safeEquals: (x, y) => Eval.defer(() => safeEquals(E, g(x), g(y))),
  });

export const deferSafeEq = <A>(thunk: () => Eq<A>) =>
  SafeEq.of<A>({ safeEquals: (x, y) => safeEquals(thunk(), x, y) });

const SafeEqTag = Symbol('@fp4ts/schema/kernel/safe-eq');
function isSafeEquals<A>(E: Eq<A>): E is SafeEq<A> {
  return SafeEqTag in E;
}

export function safeEquals<A>(E: Eq<A>, x: A, y: A): Eval<boolean> {
  return isSafeEquals(E)
    ? E.safeEquals(x, y)
    : Eval.delay(() => E.equals(x, y));
}

export interface SafeEq<A> extends Eq<A> {
  safeEquals(l: A, r: A): Eval<boolean>;
  [SafeEqTag]: true;
}
export type SafeEqRequirements<A> = Pick<SafeEq<A>, 'safeEquals'>;
export const SafeEq = Object.freeze({
  of: <A>(E: SafeEqRequirements<A>): SafeEq<A> => {
    const self: SafeEq<A> = {
      ...E,
      ...Eq.of({ equals: (x, y) => self.safeEquals(x, y).value }),
      [SafeEqTag]: true,
    };
    return self;
  },

  by<A, B>(E: SafeEq<A>, f: (b: B) => A): SafeEq<B> {
    return SafeEq.of({
      safeEquals: (x, y) => Eval.defer(() => E.safeEquals(f(x), f(y))),
    });
  },
});
