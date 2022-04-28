// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import {
  Applicative,
  ApplicativeError,
  Apply,
  Contravariant,
  EqK,
  FunctionK,
  Functor,
  FlatMap,
  Monad,
  MonadError,
} from '@fp4ts/cats-core';
import { Chain, Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { MonadWriter } from '../monad-writer';

export type WriterT<F, L, V> = _WriterT<F, L, V>;
export const WriterT: WriterTObj = function (flv) {
  return new _WriterT(flv);
};

class _WriterT<F, L, V> {
  public constructor(public readonly value: Kind<F, [[Chain<L>, V]]>) {}

  // -- Writer Methods

  tell<LL>(
    this: WriterT<F, LL, V>,
    F: Functor<F>,
  ): (l: LL) => WriterT<F, LL, V> {
    return l => WriterT(F.map_(this.value, ([ll, v]) => [ll.append(l), v]));
  }
  log<LL>(
    this: WriterT<F, LL, V>,
    F: Functor<F>,
  ): (l: LL) => WriterT<F, LL, V> {
    return this.tell(F);
  }

  listen(F: Functor<F>): WriterT<F, L, [Chain<L>, V]>;
  listen<LL>(F: Functor<F>, L: Monoid<LL>): WriterT<F, LL, [LL, V]>;
  listen(F: Functor<F>, L?: Monoid<any>): WriterT<F, any, [any, V]> {
    return L
      ? WriterT(
          F.map_(this.value, ([l, v]) => {
            const ll = l.folding(L);
            return [Chain(ll), [ll, v]];
          }),
        )
      : WriterT(F.map_(this.value, ([l, v]) => [l, [l, v]]));
  }

  written(F: Functor<F>): WriterT<F, L, Chain<L>>;
  written<LL>(F: Functor<F>, L: Monoid<LL>): WriterT<F, LL, LL>;
  written(F: Functor<F>, L?: Monoid<any>): WriterT<F, any, any> {
    return L
      ? WriterT(
          F.map_(this.value, ([l]) => {
            const ll = l.folding(L);
            return [Chain(ll), ll];
          }),
        )
      : WriterT(F.map_(this.value, ([l]) => [l, l]));
  }

  censor<LL>(
    this: WriterT<F, LL, V>,
    F: Functor<F>,
  ): (f: (lc: Chain<LL>) => Chain<LL>) => WriterT<F, LL, V> {
    return f => WriterT(F.map_(this.value, ([l, v]) => [f(l), v]));
  }

  reset(F: Functor<F>): WriterT<F, L, V> {
    return WriterT(F.map_(this.value, ([, v]) => [Chain.empty, v]));
  }

  // -- Value Methods

  map(F: Functor<F>): <B>(f: (a: V) => B) => WriterT<F, L, B> {
    return f => WriterT(F.map_(this.value, ([c, v]) => [c, f(v)]));
  }

  mapK<G>(nt: FunctionK<F, G>): WriterT<G, L, V> {
    return WriterT(nt(this.value));
  }

  contramap<VV>(
    this: WriterT<F, L, VV>,
    F: Contravariant<F>,
  ): <Z>(f: (z: Z) => VV) => WriterT<F, L, Z> {
    return f => WriterT(F.contramap_(this.value, ([c, z]) => [c, f(z)]));
  }

  public void(F: Functor<F>): WriterT<F, L, void> {
    return this.map(F)(() => {});
  }

  public map2<LL>(
    this: WriterT<F, LL, V>,
    F: Apply<F>,
  ): <U, C>(
    that: WriterT<F, LL, U>,
    f: (v: V, u: U) => C,
  ) => WriterT<F, LL, C> {
    return (that, f) =>
      WriterT(
        F.map2_(
          this.value,
          that.value,
        )(([l, v], [ll, u]) => [l['+++'](ll), f(v, u)]),
      );
  }

  public product<LL>(
    this: WriterT<F, LL, V>,
    F: Apply<F>,
  ): <U>(that: WriterT<F, LL, U>) => WriterT<F, LL, [V, U]> {
    return that => this.map2(F)(that, tupled);
  }
  public productL<LL>(
    this: WriterT<F, LL, V>,
    F: Apply<F>,
  ): <U>(that: WriterT<F, LL, U>) => WriterT<F, LL, V> {
    return that => this.map2(F)(that, a => a);
  }
  public '<<<'<LL>(
    this: WriterT<F, LL, V>,
    F: Apply<F>,
  ): <U>(that: WriterT<F, LL, U>) => WriterT<F, LL, V> {
    return this.productL(F);
  }
  public productR<LL>(
    this: WriterT<F, LL, V>,
    F: Apply<F>,
  ): <U>(that: WriterT<F, LL, U>) => WriterT<F, LL, U> {
    return that => this.map2(F)(that, (a, b) => b);
  }
  public '>>>'<LL>(
    this: WriterT<F, LL, V>,
    F: Apply<F>,
  ): <U>(that: WriterT<F, LL, U>) => WriterT<F, LL, U> {
    return this.productR(F);
  }

  public flatMap<LL>(
    this: WriterT<F, LL, V>,
    F: FlatMap<F>,
  ): <U>(f: (v: V) => WriterT<F, LL, U>) => WriterT<F, LL, U> {
    return f =>
      WriterT(
        F.flatMap_(this.value, ([l, v]) =>
          F.map_(f(v).value, ([ll, u]) => [l['+++'](ll), u]),
        ),
      );
  }

  // -- Run Methods

  public runWriter(): Kind<F, [[Chain<L>, V]]>;
  public runWriter<LL>(
    this: WriterT<F, LL, V>,
    F: Functor<F>,
    L: Monoid<LL>,
  ): Kind<F, [[LL, V]]>;
  public runWriter(
    this: WriterT<F, any, V>,
    F?: Functor<F>,
    L?: Monoid<any>,
  ): Kind<F, [[any, V]]> {
    return F ? F.map_(this.value, ([c, v]) => [c.folding(L!), v]) : this.value;
  }
}

interface WriterTObj {
  <F, L, V>(flv: Kind<F, [[Chain<L>, V]]>): WriterT<F, L, V>;

  liftF<F>(F: Functor<F>): <V, L = never>(fv: Kind<F, [V]>) => WriterT<F, L, V>;
  pure<F>(F: Applicative<F>): <V, L = never>(v: V) => WriterT<F, L, V>;
  unit<F, L = never>(F: Applicative<F>): WriterT<F, L, void>;
  tell<F>(F: Applicative<F>): <L>(l: L) => WriterT<F, L, void>;

  // -- Instances

  EqK<F, L>(F: EqK<F>, L: Monoid<L>, LE: Eq<L>): EqK<$<WriterTF, [F, L]>>;
  Functor<F, L>(F: Functor<F>): Functor<$<WriterTF, [F, L]>>;
  Contravariant<F, L>(F: Contravariant<F>): Contravariant<$<WriterTF, [F, L]>>;
  Apply<F, L>(F: Apply<F>): Apply<$<WriterTF, [F, L]>>;
  FlatMap<F, L>(F: FlatMap<F>): FlatMap<$<WriterTF, [F, L]>>;
  Applicative<F, L>(F: Applicative<F>): Applicative<$<WriterTF, [F, L]>>;
  Monad<F, L>(F: Monad<F>): Monad<$<WriterTF, [F, L]>>;
  ApplicativeError<F, L, E>(
    F: ApplicativeError<F, E>,
  ): ApplicativeError<$<WriterTF, [F, L]>, E>;
  MonadError<F, L, E>(F: MonadError<F, E>): MonadError<$<WriterTF, [F, L]>, E>;

  MonadWriter<F, L>(
    F: Monad<F>,
    L: Monoid<L>,
  ): MonadWriter<$<WriterTF, [F, L]>, L>;
}

WriterT.liftF = F => fv => WriterT(F.map_(fv, v => [Chain.empty, v]));
WriterT.pure = F => v => WriterT(F.pure([Chain.empty, v]));
WriterT.unit = F => WriterT(F.pure([Chain.empty, undefined]));
WriterT.tell = F => l => WriterT(F.pure([Chain(l), undefined]));

// -- Instances

const writerTEqK = <F, L>(
  F: EqK<F>,
  L: Monoid<L>,
  LE: Eq<L>,
): EqK<$<WriterTF, [F, L]>> =>
  EqK.of({
    liftEq: <V>(V: Eq<V>): Eq<WriterT<F, L, V>> => {
      const FE = F.liftEq(
        Eq.tuple(
          Eq.by(LE, (c: Chain<L>) => c.folding(L)),
          V,
        ),
      );
      return Eq.of({ equals: (l, r) => FE.equals(l.value, r.value) });
    },
  });

const writerTFunctor = <F, L>(F: Functor<F>): Functor<$<WriterTF, [F, L]>> =>
  Functor.of({ map_: (fa, f) => fa.map(F)(f) });

const writerTContravariant = <F, L>(
  F: Contravariant<F>,
): Contravariant<$<WriterTF, [F, L]>> =>
  Contravariant.of({ contramap_: (fa, f) => fa.contramap(F)(f) });

const writerTApply = <F, L>(F: Apply<F>): Apply<$<WriterTF, [F, L]>> =>
  Apply.of<$<WriterTF, [F, L]>>({
    ...writerTFunctor(F),
    ap_: (ff, fa) => ff.map2(F)(fa, (f, a) => f(a)),
    map2_: (fa, fb) => f => fa.map2(F)(fb, f),
    product_: (fa, fb) => fa.product(F)(fb),
    productL_: (fa, fb) => fa.productL(F)(fb),
    productR_: (fa, fb) => fa.productR(F)(fb),
  });

const writerTFlatMap = <F, L>(F: FlatMap<F>): FlatMap<$<WriterTF, [F, L]>> =>
  FlatMap.of({
    ...writerTApply(F),
    flatMap_: (fa, f) => fa.flatMap(F)(f),
    tailRecM_: <S, A>(
      s0: S,
      f: (s: S) => WriterT<F, L, Either<S, A>>,
    ): WriterT<F, L, A> =>
      WriterT(
        F.tailRecM(tupled(Chain.empty as Chain<L>, s0))(([l, s]) =>
          F.map_(f(s).value, ([ll, sa]) =>
            sa.fold(
              s => Left(tupled(l['+++'](ll), s)),
              a => Right(tupled(l['+++'](ll), a)),
            ),
          ),
        ),
      ),
  });

const writerTApplicative = <F, L>(
  F: Applicative<F>,
): Applicative<$<WriterTF, [F, L]>> =>
  Applicative.of({ ...writerTApply(F), pure: WriterT.pure(F) });

const writerTMonad = <F, L>(F: Monad<F>): Monad<$<WriterTF, [F, L]>> =>
  Monad.of({ ...writerTApplicative(F), ...writerTFlatMap(F) });

const writerTApplicativeError = <F, L, E>(
  F: ApplicativeError<F, E>,
): ApplicativeError<$<WriterTF, [F, L]>, E> =>
  ApplicativeError.of({
    ...writerTApplicative(F),
    throwError: <A>(e: E) => WriterT(F.throwError<[Chain<L>, A]>(e)),
    handleErrorWith_: (fa, h) =>
      WriterT(F.handleErrorWith_(fa.value, e => h(e).value)),
  });
const writerTMonadError = <F, L, E>(
  F: MonadError<F, E>,
): MonadError<$<WriterTF, [F, L]>, E> =>
  MonadError.of({
    ...writerTMonad(F),
    ...writerTApplicativeError(F),
  });
const writerTMonadWriter = <F, L>(
  F: Monad<F>,
  L: Monoid<L>,
): MonadWriter<$<WriterTF, [F, L]>, L> =>
  MonadWriter.of({
    monoid: L,
    ...WriterT.Monad(F),

    censor_: (fa, f) => fa.censor(F)(lc => Chain(f(lc.folding(L)))),
    listen: fa => fa.listen(F, L),
    tell: WriterT.tell(F),
  });

WriterT.EqK = writerTEqK;
WriterT.Functor = writerTFunctor;
WriterT.Contravariant = writerTContravariant;
WriterT.Apply = writerTApply;
WriterT.FlatMap = writerTFlatMap;
WriterT.Applicative = writerTApplicative;
WriterT.Monad = writerTMonad;
WriterT.ApplicativeError = writerTApplicativeError;
WriterT.MonadError = writerTMonadError;
WriterT.MonadWriter = writerTMonadWriter;

// -- HKT

export interface WriterTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: WriterT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
