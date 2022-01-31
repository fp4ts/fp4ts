// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  Map,
  Right,
  Vector,
  Kleisli,
  Try,
  Ior,
  OptionT,
  EitherT,
  Queue,
  AndThen,
  IndexedStateT,
  State,
  WriterT,
  Writer,
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
        const s0 = fc.integer({ min: 1, max: size - 1 });
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

export const fp4tsQueue = <A>(arbA: Arbitrary<A>): Arbitrary<Queue<A>> =>
  fc
    .array(arbA)
    .chain(_in =>
      fc
        .array(arbA)
        .map(_out =>
          Queue.fromArray(_out)['+++'](Queue.fromArray(_in).reverse),
        ),
    );

interface OrderedMapConstraints {
  readonly minSize?: number;
  readonly maxSize?: number;
}
export const fp4tsOrderedMap = <K, V>(
  arbK: Arbitrary<K>,
  arbV: Arbitrary<V>,
  O: Ord<K>,
  constraints: OrderedMapConstraints = {},
): Arbitrary<Map<K, V>> => {
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
    .integer({ min: minSize, max: maxSize })
    .chain(size =>
      fc
        .array(fc.tuple(arbK, arbV), { minLength: size, maxLength: size })
        .map(Map.fromArray(O)),
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
    .integer({ min: minSize, max: maxSize })
    .chain(size =>
      fc
        .array(fc.tuple(arbK, arbV), { minLength: size, maxLength: size })
        .map(HashMap.fromArray(H)),
    );
};

export const fp4tsWriterT = <F, L, V>(
  arbFLV: Arbitrary<Kind<F, [[L, V]]>>,
): Arbitrary<WriterT<F, L, V>> => arbFLV.map(WriterT);

export const fp4tsWriter = <L, V>(
  arbFLV: Arbitrary<[L, V]>,
): Arbitrary<Writer<L, V>> => arbFLV.map(Writer);

export const fp4tsKleisli = <F, A, B>(
  arbFB: Arbitrary<Kind<F, [B]>>,
): Arbitrary<Kleisli<F, A, B>> =>
  fc.func<[A], Kind<F, [B]>>(arbFB).map(Kleisli);

export const fp4tsAndThen = <A>(
  arbA: Arbitrary<A>,
): Arbitrary<AndThen<A, A>> => {
  const { go } = fc.letrec(tie => ({
    base: fc.func<[A], A>(arbA).map(AndThen),
    rec: fc
      .tuple(
        tie('go') as Arbitrary<AndThen<A, A>>,
        tie('go') as Arbitrary<AndThen<A, A>>,
      )
      .map(([f, g]) => f.andThen(g)),
    go: fc.oneof({ maxDepth: 20 }, tie('base'), tie('rec')),
  }));

  return go as Arbitrary<AndThen<A, A>>;
};

export const fp4tsIndexedStateT = <F, SA, SB, A>(
  arbFSAFSBA: Arbitrary<Kind<F, [(sa: SA) => Kind<F, [[SB, A]]>]>>,
): Arbitrary<IndexedStateT<F, SA, SB, A>> => arbFSAFSBA.map(IndexedStateT);

export const fp4tsState = <S, A>(
  arbS: Arbitrary<S>,
  arbA: Arbitrary<A>,
): Arbitrary<State<S, A>> =>
  fp4tsIndexedStateT(
    fc.func<[S], Eval<[S, A]>>(fp4tsEval(fc.tuple(arbS, arbA))).map(Eval.pure),
  );
