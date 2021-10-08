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
