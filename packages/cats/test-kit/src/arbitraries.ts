import fc, { Arbitrary } from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { Eval } from '@cats4ts/cats-core';
import { Either, Left, Option, Right } from '@cats4ts/cats-core/lib/data';

export const cats4tsPrimitive = (): Arbitrary<PrimitiveType> =>
  fc.oneof(fc.integer(), fc.float(), fc.string(), fc.boolean());

export const cats4tsOption = <A>(arbA: Arbitrary<A>): Arbitrary<Option<A>> =>
  fc.option(arbA).map(Option.fromNullable);

export const cats4tsEither = <E, A>(
  arbE: Arbitrary<E>,
  arbA: Arbitrary<A>,
): Arbitrary<Either<E, A>> => fc.oneof(arbE.map(Left), arbA.map(Right));

export const cats4tsEval = <A>(arbA: Arbitrary<A>): Arbitrary<Eval<A>> =>
  fc.oneof(
    arbA.map(Eval.now),
    arbA.map(a => () => a).map(Eval.later),
    arbA.map(a => () => a).map(Eval.later),
  );
