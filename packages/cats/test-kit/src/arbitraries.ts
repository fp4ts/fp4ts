// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, Kind, PrimitiveType } from '@fp4ts/core';
import {
  Either,
  Left,
  Option,
  Right,
  Kleisli,
  Try,
  Ior,
  OptionT,
  EitherT,
  Coproduct,
} from '@fp4ts/cats-core/lib/data';
import { MiniInt } from './mini-int';

export const fp4tsError = (): Arbitrary<Error> =>
  fc.oneof(
    fc.string().map(m => new Error(m)),
    fc.string().map(m => new TypeError(m)),
    fc.string().map(m => new RangeError(m)),
  );

export const fp4tsMiniInt = (): Arbitrary<MiniInt> =>
  fc
    .integer({ min: MiniInt.MIN_MINI_INT, max: MiniInt.MAX_MINI_INT })
    .map(MiniInt.wrapped);

export const fp4tsPrimitive = (): Arbitrary<PrimitiveType> =>
  fc.oneof(fc.integer(), fc.float(), fc.string(), fc.boolean());

export const fp4tsOption = <A>(arbA: Arbitrary<A>): Arbitrary<Option<A>> =>
  fc.option(arbA).map(Option.fromNullable);

export const fp4tsOptionT = <F, A>(
  arbA: Arbitrary<Kind<F, [Option<A>]>>,
): Arbitrary<OptionT<F, A>> => arbA.map(OptionT);

export const fp4tsEither = <E, A>(
  arbE: Arbitrary<E>,
  arbA: Arbitrary<A>,
): Arbitrary<Either<E, A>> => fc.oneof(arbE.map(Left), arbA.map(Right));

export const fp4tsEitherT = <F, A, B>(
  arbA: Arbitrary<Kind<F, [Either<A, B>]>>,
): Arbitrary<EitherT<F, A, B>> => arbA.map(EitherT);

export const fp4tsIor = <A, B>(
  arbA: Arbitrary<A>,
  arbB: Arbitrary<B>,
): Arbitrary<Ior<A, B>> =>
  fc.oneof(
    arbA.map(Ior.Left),
    arbB.map(Ior.Right),
    fc.tuple(arbA, arbB).map(([a, b]) => Ior.Both(a, b)),
  );

export const fp4tsTry = <A>(arbA: Arbitrary<A>): Arbitrary<Try<A>> =>
  fc.oneof(fp4tsError().map(Try.failure), arbA.map(Try.success));

export const fp4tsEval = <A>(arbA: Arbitrary<A>): Arbitrary<Eval<A>> =>
  fc.oneof(
    arbA.map(Eval.now),
    arbA.map(a => () => a).map(Eval.later),
    arbA.map(a => () => a).map(Eval.later),
  );

export const fp4tsCoproduct = <F, G, A>(
  arbFa: Arbitrary<Kind<F, [A]>>,
  arbGa: Arbitrary<Kind<G, [A]>>,
): Arbitrary<Coproduct<F, G, A>> =>
  // prettier-ignore
  fc.oneof(arbFa.map((Coproduct.Inl)<F, G, A>), arbGa.map((Coproduct.Inr)<F, G, A>));

export const fp4tsKleisli = <F, A, B>(
  arbFB: Arbitrary<Kind<F, [B]>>,
): Arbitrary<Kleisli<F, A, B>> =>
  fc.func<[A], Kind<F, [B]>>(arbFB).map(Kleisli);

export const fp4tsEndo = <A>(arbA: Arbitrary<A>): Arbitrary<(_: A) => A> =>
  fc.func<[A], A>(arbA);
