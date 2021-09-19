import { Vector } from '../vector';
import { Cons, List, Nil } from './algebra';

export const pure = <A>(x: A): List<A> => new Cons(x, Nil);

export const cons = <A>(x: A, xs: List<A>): List<A> => new Cons(x, xs);

export const nil: List<never> = Nil;

export const empty: List<never> = Nil;

export const of = <A = never>(...xs: A[]): List<A> => fromArray(xs);

export const fromArray = <A>(xs: A[]): List<A> => {
  let results: List<A> = empty;
  let idx = xs.length;
  while (idx-- > 0) {
    results = cons(xs[idx], results);
  }
  return results;
};

export const fromVector = <A>(xs: Vector<A>): List<A> =>
  xs.foldRight(empty as List<A>, cons);
