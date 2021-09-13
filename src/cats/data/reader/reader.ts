import { URI } from '../../../core';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Reader as ReaderBase } from './algebra';
import { provide, pure, read, unit } from './constructors';
import {
  Variance,
  readerApplicative,
  readerApply,
  readerFlatMap,
  readerFunctor,
  readerMonad,
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
  provide<R>(r: R): Reader<unknown, void>;

  // -- Instances

  readonly Functor: Functor<[URI<ReaderURI, Variance>], Variance>;
  readonly Apply: Apply<[URI<ReaderURI, Variance>], Variance>;
  readonly Applicative: Applicative<[URI<ReaderURI, Variance>], Variance>;
  readonly FlatMap: FlatMap<[URI<ReaderURI, Variance>], Variance>;
  readonly Monad: Monad<[URI<ReaderURI, Variance>], Variance>;
}

Reader.pure = pure;
Reader.unit = unit;
Reader.read = read;
Reader.provide = provide;

Object.defineProperty(Reader, 'Functor', {
  get(): Functor<[URI<ReaderURI, Variance>], Variance> {
    return readerFunctor();
  },
});
Object.defineProperty(Reader, 'Apply', {
  get(): Apply<[URI<ReaderURI, Variance>], Variance> {
    return readerApply();
  },
});
Object.defineProperty(Reader, 'Applicative', {
  get(): Applicative<[URI<ReaderURI, Variance>], Variance> {
    return readerApplicative();
  },
});
Object.defineProperty(Reader, 'FlatMap', {
  get(): FlatMap<[URI<ReaderURI, Variance>], Variance> {
    return readerFlatMap();
  },
});
Object.defineProperty(Reader, 'Monad', {
  get(): Monad<[URI<ReaderURI, Variance>], Variance> {
    return readerMonad();
  },
});

// HKT

export const ReaderURI = 'cats/data/reader';
export type ReaderURI = typeof ReaderURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, TC, S, R, E, A> {
    [ReaderURI]: Reader<R, A>;
  }
}
