import { $, TyK, _ } from '../../../core';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Reader as ReaderBase } from './algebra';
import { provide, pure, read, unit } from './constructors';
import {
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

  Functor: <R>() => Functor<$<ReaderK, [R]>>;
  Apply: <R>() => Apply<$<ReaderK, [R]>>;
  Applicative: <R>() => Applicative<$<ReaderK, [R]>>;
  FlatMap: <R>() => FlatMap<$<ReaderK, [R]>>;
  Monad: <R>() => Monad<$<ReaderK, [R]>>;
}

Reader.pure = pure;
Reader.unit = unit;
Reader.read = read;
Reader.provide = provide;

Reader.Functor = readerFunctor;
Reader.Apply = readerApply;
Reader.Applicative = readerApplicative;
Reader.FlatMap = readerFlatMap;
Reader.Monad = readerMonad;

// HKT

export const ReaderURI = 'cats/data/reader';
export type ReaderURI = typeof ReaderURI;
export type ReaderK = TyK<ReaderURI, [_, _]>;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [ReaderURI]: Reader<Tys[0], Tys[1]>;
  }
}
