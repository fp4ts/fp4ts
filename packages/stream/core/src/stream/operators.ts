import { AnyK, id } from '@cats4ts/core';
import { MonadError } from '@cats4ts/cats-core';
import { SyncIoK } from '@cats4ts/effect-core';
import { Stream } from './algebra';
import { Compiler, PureCompiler } from './compiler';

export const concat: <F extends AnyK, A2>(
  s2: Stream<F, A2>,
) => <A extends A2>(s1: Stream<F, A>) => Stream<F, A2> = s2 => s1 =>
  concat_(s1, s2);

export const map: <A, B>(
  f: (a: A) => B,
) => <F extends AnyK>(s: Stream<F, A>) => Stream<F, B> = f => s => map_(s, f);

export const flatMap: <F extends AnyK, A, B>(
  f: (a: A) => Stream<F, B>,
) => (s: Stream<F, A>) => Stream<F, B> = f => s => flatMap_(s, f);

export const flatten: <F extends AnyK, A>(
  ss: Stream<F, Stream<F, A>>,
) => Stream<F, A> = ss => flatMap_(ss, id);

export const compile: <A>(s: Stream<SyncIoK, A>) => PureCompiler<A> = s =>
  new PureCompiler(s._underlying);

export const compileF: <F extends AnyK>(
  F: MonadError<F, Error>,
) => <A>(s: Stream<F, A>) => Compiler<F, A> = F => s =>
  new Compiler(F, s._underlying);

// -- Point-ful operators

export const concat_ = <F extends AnyK, A>(
  s1: Stream<F, A>,
  s2: Stream<F, A>,
): Stream<F, A> => new Stream(s1._underlying.flatMap(() => s2._underlying));

export const map_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => B,
): Stream<F, B> => new Stream(s._underlying.mapOutput(f));

export const flatMap_ = <F extends AnyK, A, B>(
  s: Stream<F, A>,
  f: (a: A) => Stream<F, B>,
): Stream<F, B> =>
  new Stream(s._underlying.flatMapOutput(o => f(o)._underlying));
