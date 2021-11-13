import fc, { Arbitrary } from 'fast-check';
import { Kind, PrimitiveType } from '@fp4ts/core';
import { Eval, Hashable, Ord } from '@fp4ts/cats-core';
import {
  Chain,
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
  OptionT,
} from '@fp4ts/cats-core/lib/data';
import { MiniInt } from './mini-int';

export const fp4tsError = (): Arbitrary<Error> =>
  fc.oneof(
    fc.string().map(m => new Error(m)),
    fc.string().map(m => new TypeError(m)),
    fc.string().map(m => new RangeError(m)),
  );

export const fp4tsMiniInt = (): Arbitrary<MiniInt> =>
  fc.integer(MiniInt.MIN_MINI_INT, MiniInt.MAX_MINI_INT).map(MiniInt.wrapped);

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

interface ListConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const fp4tsList = <A>(
  arbA: Arbitrary<A>,
  constraints: ListConstraints = {},
): Arbitrary<List<A>> => fc.array(arbA, constraints).map(List.fromArray);

interface VectorConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const fp4tsVector = <A>(
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

export const fp4tsChain = <A>(arbA: Arbitrary<A>): Arbitrary<Chain<A>> => {
  const maxDepth = 5;

  const base = fc.frequency(
    { weight: 1, arbitrary: fc.constant(Chain.empty) },
    { weight: 5, arbitrary: arbA.chain(x => fc.constant(Chain.singleton(x))) },
    {
      weight: 20,
      arbitrary: fc.array(arbA).chain(xs => fc.constant(Chain.fromArray(xs))),
    },
  );

  const recursive = fc.memo((depth: number): Arbitrary<Chain<A>> => {
    if (depth >= maxDepth) return base;
    return fc
      .tuple(gen(depth + 1), gen(depth + 1))
      .map(([pfx, sfx]) => pfx['+++'](Chain.empty)['+++'](sfx));
  });

  const gen = (depth: number): Arbitrary<Chain<A>> =>
    fc.oneof(base, recursive(depth));

  return gen(0);
};

interface OrderedMapConstraints {
  readonly minSize?: number;
  readonly maxSize?: number;
}
export const fp4tsOrderedMap = <K, V>(
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
export const fp4tsHashMap = <K, V>(
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

export const fp4tsKleisli = <F, A, B>(
  arbFB: Arbitrary<Kind<F, [B]>>,
): Arbitrary<Kleisli<F, A, B>> =>
  fc.func<[A], Kind<F, [B]>>(arbFB).map(Kleisli);
