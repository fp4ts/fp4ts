import { Either } from './either';
import * as E from './either';
import { compose, Lazy } from './core';

export type PromiseEither<E, A> = Promise<Either<E, A>>;

export const left: <E>(e: E) => PromiseEither<E, never> = e =>
  Promise.resolve(E.left(e));

export const right: <A>(a: A) => PromiseEither<never, A> = x =>
  Promise.resolve(E.right(x));

export const pureF: <A>(a: Promise<A>) => PromiseEither<never, A> = x =>
  x.then(E.right);

export const fromPromise: <A>(a: Promise<A>) => PromiseEither<Error, A> = x =>
  x
    .then(E.right)
    .catch(e => (e instanceof Error ? E.left(e) : E.left(new Error(e))));

export const toPromise = <E, A>(fa: PromiseEither<E, A>): Promise<A> =>
  fa.then(
    E.fold<E, A, Promise<A>>(
      Promise.reject.bind(Promise),
      Promise.resolve.bind(Promise),
    ),
  );

export const fold: <E, A, B>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (fa: PromiseEither<E, A>) => Promise<B> = (onLeft, onRight) => fa =>
  fold_(fa, onLeft, onRight);

export const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: PromiseEither<E, A>) => PromiseEither<E, B> = f => fa =>
  map_(fa, f);

export const flatMap: <E, A, B>(
  f: (a: A) => PromiseEither<E, B>,
) => (fa: PromiseEither<E, A>) => PromiseEither<E, B> = f => fa =>
  flatMap_(fa, f);

export const flatMapF: <A, B>(
  f: (a: A) => Promise<B>,
) => <E>(fa: PromiseEither<E, A>) => PromiseEither<E, B> = f => fa =>
  flatMapF_(fa, f);

export const orElse: <A>(
  defaultValue: Lazy<A>,
) => <E>(fa: PromiseEither<E, A>) => Promise<A> = defaultValue => fa =>
  orElse_(fa, defaultValue);

export const fold_: <E, A, B>(
  fa: PromiseEither<E, A>,
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => Promise<B> = (fa, onLeft, onRight) => fa.then(E.fold(onLeft, onRight));

export const map_: <E, A, B>(
  fa: PromiseEither<E, A>,
  f: (a: A) => B,
) => PromiseEither<E, B> = (fa, f) => fa.then(E.map(f));

export const flatMap_: <E, A, B>(
  fa: PromiseEither<E, A>,
  f: (a: A) => PromiseEither<E, B>,
) => PromiseEither<E, B> = (fa, f) => fa.then(E.fold(left, f));

export const flatMapF_: <E, A, B>(
  fa: PromiseEither<E, A>,
  f: (a: A) => Promise<B>,
) => PromiseEither<E, B> = (fa, f) => flatMap_(fa, compose(pureF, f));

export const orElse_: <E, A>(
  fa: PromiseEither<E, A>,
  defaultValue: Lazy<A>,
) => Promise<A> = (fa, defaultValue) => fa.then(E.orElse(defaultValue));
