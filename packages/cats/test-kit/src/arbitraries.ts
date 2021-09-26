import fc, { Arbitrary } from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { Eval } from '@cats4ts/cats-core';
import {
  Either,
  Left,
  List,
  Option,
  Right,
  Vector,
} from '@cats4ts/cats-core/lib/data';

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

interface ListConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const cats4tsList = <A>(
  arbA: Arbitrary<A>,
  constraints: ListConstraints = {},
): Arbitrary<List<A>> => fc.array(arbA, constraints).map(List.fromArray);

interface VectorConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const cats4tsVector = <A>(
  arbA: Arbitrary<A>,
  constraints: VectorConstraints = {},
): Arbitrary<Vector<A>> => {
  const minLength =
    constraints.minLength != null && constraints.minLength >= 0
      ? constraints.minLength
      : 0;
  const maxLength =
    constraints.maxLength != null &&
    constraints.maxLength <= Number.MAX_SAFE_INTEGER
      ? constraints.maxLength
      : Math.min(2 * minLength + 10, 0x7fffffff);
  const size = fc.integer(minLength, maxLength);

  const genSized = fc.memo((size: number) => {
    const fromArray = fc
      .array(arbA, { minLength: size, maxLength: size })
      .map(Vector.fromArray);

    let recursive: Arbitrary<Vector<A>>;
    switch (size) {
      case 0:
        recursive = fc.constant(Vector.empty);
        break;
      case 1:
        recursive = arbA.map(Vector.pure);
        break;
      default: {
        const s0 = fc.integer(1, size - 1);
        const s1 = s0.map(s0 => size - s0);
        const left = s0.chain(genSized);
        const right = s1.chain(genSized);
        recursive = left.chain(l => right.map(r => l['+++'](r)));
        break;
      }
    }

    return fc.frequency(
      { arbitrary: recursive, weight: 3 },
      { arbitrary: fromArray, weight: 1 },
    );
  });

  return size.chain(genSized);
};
