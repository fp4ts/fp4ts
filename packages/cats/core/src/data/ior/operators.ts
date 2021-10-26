import { compose, constant, id } from '@fp4ts/core';
import { Option, Some, None } from '../option';
import { Either, Left, Right } from '../either';
import { Eq } from '../../eq';
import { Semigroup } from '../../semigroup';

import { Ior, view } from './algebra';
import { both, left, right } from './constructors';

export const isLeft = <A, B>(ior: Ior<A, B>): boolean =>
  fold_(ior, constant(true), constant(false), constant(false));
export const isRight = <A, B>(ior: Ior<A, B>): boolean =>
  fold_(ior, constant(false), constant(true), constant(false));
export const isBoth = <A, B>(ior: Ior<A, B>): boolean =>
  fold_(ior, constant(false), constant(false), constant(true));

export const swapped = <A, B>(ior: Ior<A, B>): Ior<B, A> =>
  fold_(ior, right, left, (a, b) => both(b, a));

export const getLeft = <A, B>(ior: Ior<A, B>): Option<A> =>
  fold_(ior, Some, constant(None), a => Some(a));

export const getRight = <A, B>(ior: Ior<A, B>): Option<B> =>
  fold_(ior, constant(None), Some, (_, b) => Some(b));

export const getOnlyLeft = <A, B>(ior: Ior<A, B>): Option<A> =>
  fold_(ior, Some, constant(None), constant(None));

export const getOnlyRight = <A, B>(ior: Ior<A, B>): Option<B> =>
  fold_(ior, constant(None), Some, constant(None));

export const getOnlyLeftOrRight = <A, B>(
  ior: Ior<A, B>,
): Option<Either<A, B>> =>
  fold_<A, B, Option<Either<A, B>>>(
    ior,
    a => Some(Left(a)),
    b => Some(Right(b)),
    constant(None),
  );

export const getOnlyBoth = <A, B>(ior: Ior<A, B>): Option<[A, B]> =>
  fold_(ior, constant(None), constant(None), (a, b) => Some([a, b]));

export const toOption: <A, B>(ior: Ior<A, B>) => Option<B> = getRight;

export const toEither = <A, B>(ior: Ior<A, B>): Either<A, B> =>
  fold_<A, B, Either<A, B>>(ior, Left, Right, (_, b) => Right(b));

export const pad = <A, B>(ior: Ior<A, B>): [Option<A>, Option<B>] =>
  fold_(
    ior,
    a => [Some(a), None],
    b => [None, Some(b)],
    (a, b) => [Some(a), Some(b)],
  );

export const map: <B, D>(g: (b: B) => D) => <A>(ior: Ior<A, B>) => Ior<A, D> =
  g => ior =>
    map_(ior, g);

export const leftMap: <A, C>(
  f: (a: A) => C,
) => <B>(ior: Ior<A, B>) => Ior<C, B> = f => ior => leftMap_(ior, f);

export const bimap: <A, B, C, D>(
  f: (a: A) => C,
  g: (b: B) => D,
) => (ior: Ior<A, B>) => Ior<C, D> = (f, g) => ior => bimap_(ior, f, g);

export const flatMap: <AA>(
  S: Semigroup<AA>,
) => <B, C>(
  f: (b: B) => Ior<AA, C>,
) => <A extends AA>(ior: Ior<A, B>) => Ior<AA, C> = S => f => ior =>
  flatMap_(S)(ior, f);

export const combine: <AA, BB>(
  SA: Semigroup<AA>,
  SB: Semigroup<BB>,
) => (
  ior2: Ior<AA, BB>,
) => <A extends AA, B extends BB>(ior1: Ior<A, B>) => Ior<AA, BB> =
  (SA, SB) => ior2 => ior1 =>
    combine_(SA, SB)(ior1, ior2);

export const merge: <AA>(
  S: Semigroup<AA>,
) => <A extends AA>(ior: Ior<A, A>) => AA = S => ior =>
  fold_(ior, id, id, (a1, a2) => S.combine_(a1, () => a2));

export const mergeWith: <A>(f: (l: A, r: A) => A) => (ior: Ior<A, A>) => A =
  f => ior =>
    mergeWith_(ior, f);

export const tailRecM: <AA>(
  S: Semigroup<AA>,
) => <S>(
  s: S,
) => <A extends AA, B>(f: (s: S) => Ior<A, Either<S, B>>) => Ior<AA, B> =
  S => s => f =>
    tailRecM_(S)(s, f);

export const fold: <A, B, C>(
  onLeft: (a: A) => C,
  onRight: (b: B) => C,
  onBoth: (a: A, b: B) => C,
) => (ior: Ior<A, B>) => C = (onLeft, onRight, onBoth) => ior =>
  fold_(ior, onLeft, onRight, onBoth);

// -- Point-ful operators

export const map_ = <A, B, D>(ior: Ior<A, B>, g: (b: B) => D): Ior<A, D> =>
  bimap_(ior, id, g);

export const leftMap_ = <A, B, C>(ior: Ior<A, B>, f: (a: A) => C): Ior<C, B> =>
  bimap_(ior, f, id);

export const bimap_ = <A, B, C, D>(
  ior: Ior<A, B>,
  f: (a: A) => C,
  g: (b: B) => D,
): Ior<C, D> =>
  fold_(ior, compose(left, f), compose(right, g), (a, b) => both(f(a), g(b)));

export const flatMap_ =
  <AA>(S: Semigroup<AA>) =>
  <A extends AA, B, C>(ior: Ior<A, B>, f: (b: B) => Ior<AA, C>): Ior<AA, C> =>
    // prettier-ignore
    fold_(
      ior,
      left,
      b => fold_(f(b), left, right, both),
      (a, b) =>
        fold_(
          f(b),
          aa      => left(S.combine_(a, () => aa)),
          c       => both(a, c),
          (aa, c) => both(S.combine_(a, () => aa), c),
        ),
    );

export const combine_ =
  <AA, BB>(SA: Semigroup<AA>, SB: Semigroup<BB>) =>
  <A extends AA, B extends BB>(ior1: Ior<A, B>, ior2: Ior<A, B>): Ior<AA, BB> =>
    // prettier-ignore
    fold_(
      ior1,
      a1 => fold_(
        ior2,
        a2       => left(SA.combine_(a1, () => a2)),
        b2       => both(a1, b2),
        (a2, b2) => both(SA.combine_(a1, () => a2), b2),
      ),
      b1 => fold_(
        ior2,
        a2       => both(a2, b1),
        b2       => right(SB.combine_(b1, () => b2)),
        (a2, b2) => both(a2, SB.combine_(b1, () => b2)),
      ),
      (a1, b1) => fold_(
        ior2,
        a2       => both(SA.combine_(a1, () => a2), b1),
        b2       => both(a1, SB.combine_(b1, () => b2)),
        (a2, b2) => both(SA.combine_(a1, () => a2), SB.combine_(b1, () => b2)),
      ),
    );

export const mergeWith_ = <A>(ior: Ior<A, A>, f: (l: A, r: A) => A): A =>
  fold_(ior, id, id, f);

export const tailRecM_ =
  <AA>(S: Semigroup<AA>) =>
  <A extends AA, S, B>(s: S, f: (s: S) => Ior<A, Either<S, B>>): Ior<AA, B> => {
    let cur: Ior<AA, Either<S, B>> = f(s);
    let result: Ior<AA, B> | undefined;
    while (!result) {
      // prettier-ignore
      fold_<AA, Either<S, B>, void>(
        cur,
        a  => (result = left(a)),
        ea =>
          ea.fold<S, B, void>(
            s => (cur = f(s)),
            b => (result = right(b)),
          ),
        (a, ea) =>
          ea.fold(
            s =>
              fold_<A, Either<S, B>, void>(
                f(s),
                aa      => (cur = left(S.combine_(a, () => aa))),
                x       => (cur = both(a, x)),
                (aa, x) => (cur = both(S.combine_(a, () => aa), x)),
              ),
            b => (result = both(a, b)),
          ),
      );
    }
    return result;
  };

export const fold_ = <A, B, C>(
  ior: Ior<A, B>,
  onLeft: (a: A) => C,
  onRight: (b: B) => C,
  onBoth: (a: A, b: B) => C,
): C => {
  const v = view(ior);
  switch (v.tag) {
    case 'left':
      return onLeft(v.value);
    case 'right':
      return onRight(v.value);
    case 'both':
      return onBoth(v._left, v._right);
  }
};

export const equals_ =
  <AA, BB>(EqA: Eq<AA>, EqB: Eq<BB>) =>
  <A extends AA, B extends BB>(lhs: Ior<A, B>, rhs: Ior<A, B>): boolean =>
    // prettier-ignore
    fold_(
    lhs,
    a1 => fold_(
      rhs,
      a2 => EqA.equals(a1, a2),
      constant(false),
      constant(false),
    ),
    b1 => fold_(
      rhs,
      constant(false),
      b2 => EqB.equals(b1, b2),
      constant(false),
    ),
    (a1, b1) => fold_(
      rhs,
      constant(false),
      constant(false),
      (a2, b2) => EqA.equals(a1, a2) && EqB.equals(b1, b2),
    )
  );
