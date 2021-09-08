import { Applicative2, Applicative2C } from '../../applicative';
import { Apply2, Apply2C } from '../../apply';
import { FlatMap2, FlatMap2C } from '../../flat-map';
import { Functor2, Functor2C } from '../../functor';
import { Monad2, Monad2C } from '../../monad';

import { Reader as ReaderBase } from './algebra';
import { provide, pure, read, unit } from './constructors';
import {
  readerApplicative2,
  readerApplicative2C,
  readerApply2,
  readerApply2C,
  readerFlatMap2,
  readerFlatMap2C,
  readerFunctor2,
  readerFunctor2C,
  readerMonad2,
  readerMonad2C,
} from './instances';

export type Reader<R, A> = ReaderBase<R, A>;

export const Reader: ReaderObj = function <A>(a: A): Reader<unknown, A> {
  return pure(a);
} as any;

interface ReaderObj {
  <A>(a: A): Reader<unknown, A>;
  pure<A>(a: A): Reader<unknown, A>;
  unit: Reader<unknown, void>;
  read<R>(): Reader<R, R>;
  provide<R>(r: R): Reader<R, void>;

  // -- Instances

  Functor2C<R>(): Functor2C<URI, R>;
  Apply2C<R>(): Apply2C<URI, R>;
  Applicative2C<R>(): Applicative2C<URI, R>;
  FlatMap2C<R>(): FlatMap2C<URI, R>;
  Monad2C<R>(): Monad2C<URI, R>;

  readonly Functor2: Functor2<URI>;
  readonly Apply2: Apply2<URI>;
  readonly Applicative2: Applicative2<URI>;
  readonly FlatMap2: FlatMap2<URI>;
  readonly Monad2: Monad2<URI>;
}

Reader.pure = pure;
Reader.unit = unit;
Reader.read = read;
Reader.provide = provide;

Reader.Functor2C = readerFunctor2C;
Reader.Apply2C = readerApply2C;
Reader.Applicative2C = readerApplicative2C;
Reader.FlatMap2C = readerFlatMap2C;
Reader.Monad2C = readerMonad2C;

Object.defineProperty(Reader, 'Functor2', {
  get(): Functor2<URI> {
    return readerFunctor2();
  },
});
Object.defineProperty(Reader, 'Apply2', {
  get(): Apply2<URI> {
    return readerApply2();
  },
});
Object.defineProperty(Reader, 'Applicative2', {
  get(): Applicative2<URI> {
    return readerApplicative2();
  },
});
Object.defineProperty(Reader, 'FlatMap2', {
  get(): FlatMap2<URI> {
    return readerFlatMap2();
  },
});
Object.defineProperty(Reader, 'Monad2', {
  get(): Monad2<URI> {
    return readerMonad2();
  },
});

// HKT

export const URI = 'cats/data/reader';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind2<E, A> {
    [URI]: Reader<E, A>;
  }
}
