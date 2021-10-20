import { $, id, Kind } from '@cats4ts/core';
import { Functor, ApplicativeError, Either } from '@cats4ts/cats';

import { Spawn } from '../spawn';
import { Sync } from '../sync';
import { MonadCancel } from '../monad-cancel';
import { Poll } from '../poll';

import { Allocate, Eval, Pure, Resource } from './algebra';
import { ExitCase } from './exit-case';
import { allocated, flatMap_, flatten } from './operators';
import { ResourceK } from './resource';

export const pure = <F, A>(a: A): Resource<F, A> => new Pure(a);

export const unit = <F>(): Resource<F, void> => pure(undefined);

export const liftF = <F, A>(fa: Kind<F, [Resource<F, A>]>): Resource<F, A> =>
  flatMap_(evalF(fa), id);

export const evalF = <F, A>(fa: Kind<F, [A]>): Resource<F, A> => new Eval(fa);

export const allocate =
  <F>(F: Functor<F>) =>
  <A>(resource: Kind<F, [[A, Kind<F, [void]>]]>): Resource<F, A> =>
    allocateCase(F.map_(resource, ([a, release]) => [a, () => release]));

export const allocateCase = <F, A>(
  resource: Kind<F, [[A, (ec: ExitCase) => Kind<F, [void]>]]>,
): Resource<F, A> => allocateFull(() => resource);

export const allocateFull = <F, A>(
  resource: (p: Poll<F>) => Kind<F, [[A, (e: ExitCase) => Kind<F, [void]>]]>,
): Resource<F, A> => new Allocate(resource);

export const make =
  <F>(F: Functor<F>) =>
  <A>(
    acquire: Kind<F, [A]>,
    release: (a: A, e: ExitCase) => Kind<F, [void]>,
  ): Resource<F, A> =>
    allocateCase(F.map_(acquire, a => [a, e => release(a, e)]));

export const makeFull =
  <F>(F: Functor<F>) =>
  <A>(
    acquire: (p: Poll<F>) => Kind<F, [A]>,
    release: (a: A, e: ExitCase) => Kind<F, [void]>,
  ): Resource<F, A> =>
    allocateFull(p => F.map_(acquire(p), a => [a, e => release(a, e)]));

export const tailRecM =
  <S>(s: S) =>
  <F, A>(f: (s: S) => Resource<F, Either<S, A>>): Resource<F, A> =>
    tailRecM_(s, f);

export const tailRecM_ = <F, A, S>(
  s: S,
  f: (s: S) => Resource<F, Either<S, A>>,
): Resource<F, A> =>
  flatMap_(f(s), ea => ea.fold(ss => tailRecM_(ss, f), pure));

export const throwError =
  <F>(F: ApplicativeError<F, Error>) =>
  (e: Error): Resource<F, never> =>
    evalF(F.throwError(e));

export const canceled = <F>(F: MonadCancel<F, Error>): Resource<F, void> =>
  evalF(F.canceled);

export const uncancelable =
  <F>(F: MonadCancel<F, Error>) =>
  <A>(body: (p: Poll<$<ResourceK, [F]>>) => Resource<F, A>): Resource<F, A> =>
    allocateFull(poll => {
      const inner: Poll<$<ResourceK, [F]>> = <B>(
        rfb: Resource<F, B>,
      ): Resource<F, B> =>
        allocateFull<F, B>(innerPoll =>
          F.map_(innerPoll(poll(allocated(F)(rfb))), ([b, rel]) => [
            b,
            (_: ExitCase) => rel,
          ]),
        );

      return F.map_(allocated(F)(body(inner)), ([a, rel]) => [
        a,
        (_: ExitCase) => rel,
      ]);
    });

export const delay =
  <F>(F: Sync<F>) =>
  <A>(thunk: () => A): Resource<F, A> =>
    evalF(F.delay(thunk));

export const defer =
  <F>(F: Sync<F>) =>
  <A>(thunk: () => Resource<F, A>): Resource<F, A> =>
    flatten(delay(F)(thunk));

export const suspend = <F>(F: Spawn<F, Error>): Resource<F, void> =>
  evalF(F.suspend);
