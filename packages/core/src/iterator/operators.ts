import { empty, lift } from './constructors';
import * as IR from './iterator-result';

export const map: <A, B>(f: (a: A) => B) => (it: Iterator<A>) => Iterator<B> =
  f => it =>
    map_(it, f);

export const flatMap: <A, B>(
  f: (a: A) => Iterator<B>,
) => (it: Iterator<A>) => Iterator<B> = f => it => flatMap_(it, f);

export const concat: <AA>(
  rhs: Iterator<AA>,
) => <A extends AA>(lhs: Iterator<A>) => Iterator<AA> = rhs => lhs =>
  concat_(lhs, rhs);

export const zipWithIndex = <A>(it: Iterator<A>): Iterator<[A, number]> => {
  let idx = 0;
  return map_(it, x => [x, idx++]);
};

// -- Point-ful operators

export const map_ = <A, B>(it: Iterator<A>, f: (a: A) => B): Iterator<B> =>
  lift(() => IR.map_(it.next(), f));

export const flatMap_ = <A, B>(
  source: Iterator<A>,
  f: (a: A) => Iterator<B>,
): Iterator<B> => {
  let cur: Iterator<B> = empty;
  return lift(() => {
    while (true) {
      const nextB = cur.next();
      if (!nextB.done) return nextB;
      const nextA = source.next();
      if (!nextA.done) {
        cur = f(nextA.value);
        continue;
      }
      return IR.done;
    }
  });
};

export const concat_ = <A>(lhs: Iterator<A>, rhs: Iterator<A>): Iterator<A> =>
  lift(() => IR.orElse_(lhs.next(), () => rhs.next()));

export const zip_ = <A, B>(
  lhs: Iterator<A>,
  rhs: Iterator<B>,
): Iterator<[A, B]> => zipWith_(lhs, rhs)((l, r) => [l, r]);

export const zipWith_ =
  <A, B>(lhs: Iterator<A>, rhs: Iterator<B>) =>
  <C>(f: (a: A, b: B) => C): Iterator<C> =>
    lift(() => IR.flatMap_(lhs.next(), l => IR.map_(rhs.next(), r => f(l, r))));

export const zipAllWith_ =
  <A, B>(
    lhs: Iterator<A>,
    rhs: Iterator<B>,
    defaultL: () => A,
    defaultR: () => B,
  ) =>
  <C>(f: (a: A, b: B) => C): Iterator<C> =>
    lift(() => {
      const l = lhs.next();
      const r = rhs.next();
      if (l.done && r.done) return IR.done;
      return IR.flatMap_(
        IR.orElse_(l, () => IR.pure(defaultL())),
        l =>
          IR.map_(
            IR.orElse_(r, () => IR.pure(defaultR())),
            r => f(l, r),
          ),
      );
    });
