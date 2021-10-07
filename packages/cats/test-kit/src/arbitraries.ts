import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind, PrimitiveType } from '@cats4ts/core';
import { Eval, Hashable, Ord } from '@cats4ts/cats-core';
import {
  Either,
  HashMap,
  Left,
  List,
  Option,
  OrderedMap,
  Right,
  Vector,
  Kleisli,
  Try,
  Ior,
} from '@cats4ts/cats-core/lib/data';
import { MiniInt } from './mini-int';

export const cats4tsError = (): Arbitrary<Error> =>
  fc.oneof(
    fc.string().map(m => new Error(m)),
    fc.string().map(m => new TypeError(m)),
    fc.string().map(m => new RangeError(m)),
  );

export const cats4tsMiniInt = (): Arbitrary<MiniInt> =>
  fc.integer(MiniInt.MIN_MINI_INT, MiniInt.MAX_MINI_INT).map(MiniInt.wrapped);

export const cats4tsPrimitive = (): Arbitrary<PrimitiveType> =>
  fc.oneof(fc.integer(), fc.float(), fc.string(), fc.boolean());

export const cats4tsOption = <A>(arbA: Arbitrary<A>): Arbitrary<Option<A>> =>
  fc.option(arbA).map(Option.fromNullable);

export const cats4tsEither = <E, A>(
  arbE: Arbitrary<E>,
  arbA: Arbitrary<A>,
): Arbitrary<Either<E, A>> => fc.oneof(arbE.map(Left), arbA.map(Right));

export const cats4tsIor = <A, B>(
  arbA: Arbitrary<A>,
  arbB: Arbitrary<B>,
): Arbitrary<Ior<A, B>> =>
  fc.oneof(
    arbA.map(Ior.Left),
    arbB.map(Ior.Right),
    fc.tuple(arbA, arbB).map(([a, b]) => Ior.Both(a, b)),
  );

export const cats4tsTry = <A>(arbA: Arbitrary<A>): Arbitrary<Try<A>> =>
  fc.oneof(cats4tsError().map(Try.failure), arbA.map(Try.success));

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

interface OrderedMapConstraints {
  readonly minSize?: number;
  readonly maxSize?: number;
}
export const cats4tsOrderedMap = <K, V>(
  arbK: Arbitrary<K>,
  arbV: Arbitrary<V>,
  O: Ord<K>,
  constraints: OrderedMapConstraints = {},
): Arbitrary<OrderedMap<K, V>> => {
  const minSize =
    constraints.minSize != null && constraints.minSize >= 0
      ? constraints.minSize
      : 0;
  const maxSize =
    constraints.maxSize != null &&
    constraints.maxSize <= Number.MAX_SAFE_INTEGER
      ? constraints.maxSize
      : Math.min(2 * minSize + 10, 0x7fffffff);

  return fc
    .integer(minSize, maxSize)
    .chain(size =>
      fc
        .array(fc.tuple(arbK, arbV), { minLength: size, maxLength: size })
        .map(OrderedMap.fromArray(O)),
    );
};

interface HashMapConstraints {
  readonly minSize?: number;
  readonly maxSize?: number;
}
export const cats4tsHashMap = <K, V>(
  arbK: Arbitrary<K>,
  arbV: Arbitrary<V>,
  H: Hashable<K>,
  constraints: HashMapConstraints = {},
): Arbitrary<HashMap<K, V>> => {
  const minSize =
    constraints.minSize != null && constraints.minSize >= 0
      ? constraints.minSize
      : 0;
  const maxSize =
    constraints.maxSize != null &&
    constraints.maxSize <= Number.MAX_SAFE_INTEGER
      ? constraints.maxSize
      : Math.min(2 * minSize + 10, 0x7fffffff);

  return fc
    .integer(minSize, maxSize)
    .chain(size =>
      fc
        .array(fc.tuple(arbK, arbV), { minLength: size, maxLength: size })
        .map(HashMap.fromArray(H)),
    );
};

export const cats4tsKleisli = <F extends AnyK, A, B>(
  arbFB: Arbitrary<Kind<F, [B]>>,
): Arbitrary<Kleisli<F, A, B>> =>
  fc.func<[A], Kind<F, [B]>>(arbFB).map(Kleisli);
