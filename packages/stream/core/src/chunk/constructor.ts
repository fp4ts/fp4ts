import { List, Chain, Either } from '@cats4ts/cats';

import {
  ArrayChunk,
  Chunk,
  EmptyChunk,
  Queue,
  SingletonChunk,
} from './algebra';

export const empty: Chunk<never> = EmptyChunk;

export const singleton = <O>(o: O): Chunk<O> => new SingletonChunk(o);

export const fromArray = <O>(os: O[]): Chunk<O> =>
  os.length === 0 ? empty : new ArrayChunk(os);

export const fromList = <O>(os: List<O>): Chunk<O> => fromArray(os.toArray);

export const emptyQueue: Chunk<never> = new Queue(Chain.empty, 0);

export const tailRecM: <S>(
  s: S,
) => <A>(f: (s: S) => Chunk<Either<S, A>>) => Chunk<A> = s => f =>
  tailRecM_(s, f);

export const tailRecM_ = <S, A>(
  s: S,
  f: (s: S) => Chunk<Either<S, A>>,
): Chunk<A> => {
  const results: A[] = [];
  let stack = List(f(s).iterator);

  while (stack.nonEmpty) {
    const [hd, tl] = stack.uncons.get;
    const next = hd.next();

    if (next.done) {
      stack = tl;
    } else if (next.value.isRight) {
      results.push(next.value.get);
    } else {
      stack = tl.prepend(hd).prepend(f(next.value.getLeft).iterator);
    }
  }

  return fromArray(results);
};
