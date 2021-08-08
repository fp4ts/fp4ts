import { constant, id, Lazy } from './core';

export interface Left<A> {
  readonly tag: 'left';
  readonly value: A;
}

export interface Right<B> {
  readonly tag: 'right';
  readonly value: B;
}

export type Either<A, B> = Left<A> | Right<B>;

export const left: <E>(e: E) => Either<E, never> = x => ({
  tag: 'left',
  value: x,
});

export const right: <A>(a: A) => Either<never, A> = x => ({
  tag: 'right',
  value: x,
});

export const rightUnit: Either<never, void> = right(undefined);

export const fold: <E, A, B1, B2 = B1>(
  onLeft: (e: E) => B1,
  onRight: (a: A) => B2,
) => (fa: Either<E, A>) => B1 | B2 = (onLeft, onRight) => fa =>
  fold_(fa, onLeft, onRight);

export const swapped: <A, B>(ea: Either<A, B>) => Either<B, A> = fold(
  right,
  left,
);

export const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: Either<E, A>) => Either<E, B> = f => fa => map_(fa, f);

export const flatMap: <E, A, B>(
  f: (a: A) => Either<E, B>,
) => (fa: Either<E, A>) => Either<E, B> = f => fa => flatMap_(fa, f);

export const orElse: <A>(defaultValue: Lazy<A>) => <E>(fa: Either<E, A>) => A =
  defaultValue => fa =>
    orElse_(fa, defaultValue);

export const toNullable: <A>(fa: Either<any, A>) => A | undefined = fold(
  constant(undefined),
  id,
);

export const fold_: <E, A, B1, B2>(
  fa: Either<E, A>,
  onLeft: (e: E) => B1,
  onRight: (a: A) => B2,
) => B1 | B2 = (fa, onLeft, onRight) =>
  fa.tag === 'right' ? onRight(fa.value) : onLeft(fa.value);

export const map_: <E, A, B>(fa: Either<E, A>, f: (a: A) => B) => Either<E, B> =
  (fa, f) => (fa.tag === 'right' ? right(f(fa.value)) : fa);

export const flatMap_: <E, A, B>(
  fa: Either<E, A>,
  f: (a: A) => Either<E, B>,
) => Either<E, B> = (fa, f) => (fa.tag === 'right' ? f(fa.value) : fa);

export const orElse_: <E, A>(fa: Either<E, A>, defaultValue: Lazy<A>) => A = (
  fa,
  defaultValue,
) => fold_(fa, defaultValue, id);
