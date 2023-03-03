// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, Kind, PrimitiveType } from '@fp4ts/core';
import { Hashable, Ord } from '@fp4ts/cats-kernel';
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
  Set,
  NonEmptyList,
  ValidationError,
  Validation,
  LazyList,
  View,
  Coproduct,
  Seq,
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

interface ListConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const fp4tsList = <A>(
  arbA: Arbitrary<A>,
  constraints: ListConstraints = {},
): Arbitrary<List<A>> => fc.array(arbA, constraints).map(List.fromArray);

export const fp4tsLazyList = <A>(
  arbA: Arbitrary<A>,
  constraints: ListConstraints = {},
): Arbitrary<LazyList<A>> =>
  fc.array(arbA, constraints).map(LazyList.fromArray);

export const fp4tsNel = <A>(arbA: Arbitrary<A>): Arbitrary<NonEmptyList<A>> =>
  fc.tuple(arbA, fp4tsList(arbA)).map(([hd, tl]) => NonEmptyList(hd, tl));

interface VectorConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const fp4tsVector = <A>(
  arbA: Arbitrary<A>,
  constraints: VectorConstraints = {},
): Arbitrary<Vector<A>> => {
  const arb = fc.array(arbA, constraints).map(Vector.fromArray);
  return fc.oneof(
    arb,
    arb.map(xs => xs.drop(1)),
    arb.map(xs => xs.dropRight(1)),
  );
};

export const fp4tsSeq = <A>(arbA: Arbitrary<A>): Arbitrary<Seq<A>> => {
  const arb = fc.array(arbA).map(Seq.fromArray);
  return fc.oneof(
    arb,
    fc.tuple(arb, arb).map(([x, y]) => x.concat(y)),
  );
};

export const fp4tsChain = <A>(arbA: Arbitrary<A>): Arbitrary<Chain<A>> => {
  const maxDepth = 5;

  const base = fc.oneof(
    { weight: 1, arbitrary: fc.constant(Chain.empty) },
    { weight: 5, arbitrary: arbA.map(Chain.singleton) },
    {
      weight: 20,
      arbitrary: fc.array(arbA).map(Chain.fromArray),
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

export const fp4tsMap = <K, V>(
  arbK: Arbitrary<K>,
  arbV: Arbitrary<V>,
  O: Ord<K> = Ord.fromUniversalCompare(),
): Arbitrary<Map<K, V>> =>
  fc.array(fc.tuple(arbK, arbV)).map(xs => Map.fromArray(O)(xs));

export const fp4tsSet = <A>(
  arbA: Arbitrary<A>,
  O: Ord<A> = Ord.fromUniversalCompare(),
): Arbitrary<Set<A>> => fc.array(arbA).map(xs => Set.fromArray(O, xs));

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

export const fp4tsView = <A>(arbA: Arbitrary<A>): Arbitrary<View<A>> =>
  fc.oneof(
    fc.array(arbA).map(View.fromArray),
    fp4tsList(arbA).map(View.fromList),
    fp4tsLazyList(arbA).map(View.fromLazyList),
    fp4tsVector(arbA).map(View.fromIterable),
  );

export const fp4tsKleisli = <F, A, B>(
  arbFB: Arbitrary<Kind<F, [B]>>,
): Arbitrary<Kleisli<F, A, B>> =>
  fc.func<[A], Kind<F, [B]>>(arbFB).map(Kleisli);

export const fp4tsEndo = <A>(arbA: Arbitrary<A>): Arbitrary<(_: A) => A> =>
  fc.func<[A], A>(arbA);

export const fp4tsValidation = <E, A>(
  arbVE: Arbitrary<ValidationError<E>>,
  arbA: Arbitrary<A>,
): Arbitrary<Validation<E, A>> =>
  fc.oneof(arbVE.map(Validation.Invalid), arbA.map(Validation.Valid));

export const fp4tsValidationError = <E>(
  arbE: Arbitrary<E>,
): Arbitrary<ValidationError<E>> => {
  const { go } = fc.letrec(tie => ({
    base: arbE.map(ValidationError),
    rec: fc
      .tuple(
        tie('go') as Arbitrary<ValidationError<E>>,
        tie('go') as Arbitrary<ValidationError<E>>,
      )
      .map(([l, r]) => l['<>'](r)),
    go: fc.oneof({ maxDepth: 10 }, tie('base'), tie('rec')),
  }));

  return go as Arbitrary<ValidationError<E>>;
};
