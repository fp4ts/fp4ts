import { id, Kind } from '@cats4ts/core';
import { FunctionK } from '../../arrow';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Either, Right } from '../either';
import { Option, Some, None } from '../option';

import { OptionT } from './algebra';

export const isEmpty: <F>(
  F: Functor<F>,
) => <A>(fa: OptionT<F, A>) => Kind<F, [boolean]> = F => fa =>
  F.map_(fa.value, opt => opt.isEmpty);

export const nonEmpty: <F>(
  F: Functor<F>,
) => <A>(fa: OptionT<F, A>) => Kind<F, [boolean]> = F => fa =>
  F.map_(fa.value, opt => opt.nonEmpty);

export const map: <F>(
  F: Functor<F>,
) => <A, B>(f: (a: A) => B) => (fa: OptionT<F, A>) => OptionT<F, B> =
  F => f => fa =>
    map_(F)(fa, f);

export const orElse: <F>(
  F: Monad<F>,
) => <B>(
  fb: () => OptionT<F, B>,
) => <A extends B>(fa: OptionT<F, A>) => OptionT<F, B> = F => fb => fa =>
  orElse_(F)(fa, fb);

export const getOrElse: <F>(
  F: Monad<F>,
) => <B>(
  defaultValue: () => B,
) => <A extends B>(fa: OptionT<F, A>) => Kind<F, [B]> =
  F => defaultValue => fa =>
    getOrElse_(F)(fa, defaultValue);

export const getOrElseF: <F>(
  F: Monad<F>,
) => <B>(
  defaultValue: () => Kind<F, [B]>,
) => <A extends B>(fa: OptionT<F, A>) => Kind<F, [B]> =
  F => defaultValue => fa =>
    getOrElseF_(F)(fa, defaultValue);

export const flatMap: <F>(
  F: Monad<F>,
) => <A, B>(
  f: (a: A) => OptionT<F, B>,
) => (fa: OptionT<F, A>) => OptionT<F, B> = F => f => fa => flatMap_(F)(fa, f);

export const flatten =
  <F>(F: Monad<F>) =>
  <A>(ffa: OptionT<F, OptionT<F, A>>): OptionT<F, A> =>
    flatMap_(F)(ffa, id);

export const tailRecM: <F>(
  F: Monad<F>,
) => <A>(a: A) => <B>(f: (a: A) => OptionT<F, Either<A, B>>) => OptionT<F, B> =
  F => a => f =>
    tailRecM_(F)(a, f);

export const fold: <F>(
  F: Monad<F>,
) => <A, B>(
  onNone: () => B,
  onSome: (a: A) => B,
) => (fa: OptionT<F, A>) => Kind<F, [B]> = F => (onNone, onSome) => fa =>
  fold_(F)(fa, onNone, onSome);

export const foldF: <F>(
  F: FlatMap<F>,
) => <A, B>(
  onNone: () => Kind<F, [B]>,
  onSome: (a: A) => Kind<F, [B]>,
) => (fa: OptionT<F, A>) => Kind<F, [B]> = F => (onNone, onSome) => fa =>
  foldF_(F)(fa, onNone, onSome);

export const mapK: <F, G>(
  nt: FunctionK<F, G>,
) => <A>(fa: OptionT<F, A>) => OptionT<G, A> = nt => fa => mapK_(fa, nt);

// Point-ful operators

export const map_ =
  <F>(F: Functor<F>) =>
  <A, B>(fa: OptionT<F, A>, f: (a: A) => B): OptionT<F, B> =>
    new OptionT(F.map_(fa.value, opt => opt.map(f)));

export const orElse_ =
  <F>(F: Monad<F>) =>
  <A>(fa: OptionT<F, A>, fb: () => OptionT<F, A>): OptionT<F, A> =>
    orElseF_(F)(fa, () => fb().value);

export const orElseF_ =
  <F>(F: Monad<F>) =>
  <A>(fa: OptionT<F, A>, fb: () => Kind<F, [Option<A>]>): OptionT<F, A> =>
    new OptionT(
      F.flatMap_(fa.value, opt => opt.fold(fb, a => F.pure(Some(a)))),
    );

export const getOrElse_ =
  <F>(F: Monad<F>) =>
  <A>(fa: OptionT<F, A>, defaultValue: () => A): Kind<F, [A]> =>
    fold_(F)(fa, defaultValue, id);

export const getOrElseF_ =
  <F>(F: Monad<F>) =>
  <A>(fa: OptionT<F, A>, defaultValue: () => Kind<F, [A]>): Kind<F, [A]> =>
    foldF_(F)(fa, defaultValue, F.pure);

export const flatMap_ =
  <F>(F: Monad<F>) =>
  <A, B>(fa: OptionT<F, A>, f: (a: A) => OptionT<F, B>): OptionT<F, B> =>
    new OptionT(
      F.flatMap_(fa.value, opt =>
        opt.fold(
          () => F.pure(None),
          a => f(a).value,
        ),
      ),
    );

export const tailRecM_ =
  <F>(F: Monad<F>) =>
  <A, B>(a: A, f: (a: A) => OptionT<F, Either<A, B>>): OptionT<F, B> =>
    new OptionT(
      F.tailRecM(a)(a0 =>
        F.map_(f(a0).value, opt =>
          opt.fold(
            () => Right(None),
            a => a.map(Some),
          ),
        ),
      ),
    );

export const fold_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    fa: OptionT<F, A>,
    onNone: () => B,
    onSome: (a: A) => B,
  ): Kind<F, [B]> =>
    F.map_(fa.value, opt => opt.fold(onNone, onSome));

export const foldF_ =
  <F>(F: FlatMap<F>) =>
  <A, B>(
    fa: OptionT<F, A>,
    onNone: () => Kind<F, [B]>,
    onSome: (a: A) => Kind<F, [B]>,
  ): Kind<F, [B]> =>
    F.flatMap_(fa.value, opt => opt.fold(onNone, onSome));

export const mapK_ = <F, G, A>(
  fa: OptionT<F, A>,
  nt: FunctionK<F, G>,
): OptionT<G, A> => new OptionT(nt(fa.value));
