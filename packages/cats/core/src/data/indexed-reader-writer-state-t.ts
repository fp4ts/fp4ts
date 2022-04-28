// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, Kind, tupled, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';

import { FlatMap } from '../flat-map';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { Applicative } from '../applicative';
import { Kleisli } from './kleisli';
import { MonadError } from '../monad-error';
import { Profunctor, Strong } from '../arrow';

import { Chain } from './collections';
import { Either, Left, Right } from './either';

export type IndexedReaderWriterStateT<F, W, S1, S2, R, A> =
  _IndexedReaderWriterStateT<F, W, S1, S2, R, A>;

export const IndexedReaderWriterStateT: IndexedReaderWriterStateTObj =
  function (frs1fws2a) {
    return new _IndexedReaderWriterStateT(frs1fws2a);
  };

class _IndexedReaderWriterStateT<F, W, S1, S2, R, A> {
  public constructor(
    public readonly runAllF: Kind<
      F,
      [(r: R, s1: S1) => Kind<F, [[Chain<W>, S2, A]]>]
    >,
  ) {}

  // -- Reader Methods

  public provide(
    F: Functor<F>,
  ): (r: R) => IndexedReaderWriterStateT<F, W, S1, S2, unknown, A> {
    return r =>
      IndexedReaderWriterStateT(
        F.map_(this.runAllF, rs1ws2a => (_r, s1) => rs1ws2a(r, s1)),
      );
  }

  public ask<R2>(
    F: Functor<F>,
  ): IndexedReaderWriterStateT<F, W, S1, S2, R & R2, R2> {
    return IndexedReaderWriterStateT(
      F.map_(
        this.runAllF,
        rs1ws2a => (rr2, s1) =>
          F.map_(rs1ws2a(rr2, s1), ([w, s2, a]) => [w, s2, rr2]),
      ),
    );
  }

  public local(
    F: Functor<F>,
  ): <R0>(f: (r0: R0) => R) => IndexedReaderWriterStateT<F, W, S1, S2, R0, A> {
    return f =>
      IndexedReaderWriterStateT(
        F.map_(this.runAllF, rs1ws2a => (r0, s1) => rs1ws2a(f(r0), s1)),
      );
  }

  // -- Writer Methods

  public tell<WW>(
    this: IndexedReaderWriterStateT<F, WW, S1, S2, R, A>,
    F: Functor<F>,
  ): (w: WW) => IndexedReaderWriterStateT<F, WW, S1, S2, R, A> {
    return ww => this.transform(F)((w, s2, a) => [w.append(ww), s2, a]);
  }
  public log<WW>(
    this: IndexedReaderWriterStateT<F, WW, S1, S2, R, A>,
    F: Functor<F>,
  ): (w: WW) => IndexedReaderWriterStateT<F, WW, S1, S2, R, A> {
    return this.tell(F);
  }

  public listen(
    F: Functor<F>,
  ): IndexedReaderWriterStateT<F, W, S1, S2, R, [Chain<W>, A]>;
  public listen<WW>(
    this: IndexedReaderWriterStateT<F, WW, S1, S2, R, A>,
    F: Functor<F>,
    W: Monoid<WW>,
  ): IndexedReaderWriterStateT<F, WW, S1, S2, R, [WW, A]>;
  public listen(
    this: IndexedReaderWriterStateT<F, any, S1, S2, R, A>,
    F: Functor<F>,
    W?: Monoid<any>,
  ): IndexedReaderWriterStateT<F, any, S1, S2, R, [any, A]> {
    return this.transform(F)((c, s2, a) =>
      W ? [c, s2, [c.folding(W), a]] : [c, s2, [c, a]],
    );
  }

  public written(
    F: Functor<F>,
  ): IndexedReaderWriterStateT<F, W, S1, S2, R, Chain<W>>;
  public written<WW>(
    this: IndexedReaderWriterStateT<F, WW, S1, S2, R, A>,
    F: Functor<F>,
    W: Monoid<WW>,
  ): IndexedReaderWriterStateT<F, WW, S1, S2, R, WW>;
  public written(
    this: IndexedReaderWriterStateT<F, any, S1, S2, R, A>,
    F: Functor<F>,
    W?: Monoid<any>,
  ): IndexedReaderWriterStateT<F, any, S1, S2, R, any> {
    return this.transform(F)((c, s2, a) =>
      W ? [c, s2, c.folding(W)] : [c, s2, c],
    );
  }

  public censor<WW>(
    this: IndexedReaderWriterStateT<F, WW, S1, S2, R, A>,
    F: Functor<F>,
  ): (
    f: (c: Chain<WW>) => Chain<WW>,
  ) => IndexedReaderWriterStateT<F, WW, S1, S2, R, A> {
    return f => this.transform(F)((c, s2, a) => [f(c), s2, a]);
  }

  // -- State Methods

  public contramap(
    F: Functor<F>,
  ): <S0>(f: (s0: S0) => S1) => IndexedReaderWriterStateT<F, W, S0, S2, R, A> {
    return f =>
      IndexedReaderWriterStateT(
        F.map_(this.runAllF, rs1ws2a => (r, s0) => rs1ws2a(r, f(s0))),
      );
  }

  public modify(
    F: Functor<F>,
  ): <S3>(f: (s2: S2) => S3) => IndexedReaderWriterStateT<F, W, S1, S3, R, A> {
    return f => this.transform(F)((w, s2, a) => [w, f(s2), a]);
  }

  public state(
    F: Functor<F>,
  ): <S3, B>(
    f: (s2: S2) => [S3, B],
  ) => IndexedReaderWriterStateT<F, W, S1, S3, R, B> {
    return f => this.transform(F)((w, s2, a) => [w, ...f(s2)]);
  }

  public dimap(
    F: Functor<F>,
  ): <S0, S3>(
    f: (s0: S0) => S1,
    g: (s2: S2) => S3,
  ) => IndexedReaderWriterStateT<F, W, S0, S3, R, A> {
    return (f, g) => this.contramap(F)(f).modify(F)(g);
  }

  public provideState(
    F: Functor<F>,
  ): (s1: S1) => IndexedReaderWriterStateT<F, W, unknown, S2, R, A> {
    return s1 =>
      IndexedReaderWriterStateT(
        F.map_(this.runAllF, rs1fws2a => r => rs1fws2a(r, s1)),
      );
  }

  public get(F: Functor<F>): IndexedReaderWriterStateT<F, W, S1, S2, R, S2> {
    return this.state(F)(s => [s, s]);
  }

  public replace<S22>(
    this: IndexedReaderWriterStateT<F, W, S1, S22, R, A>,
    F: Functor<F>,
  ): (s2: S22) => IndexedReaderWriterStateT<F, W, S1, S22, R, A> {
    return s2 => this.modify(F)(() => s2);
  }

  public bimap(
    F: Functor<F>,
  ): <S3, B>(
    f: (s2: S2) => S3,
    g: (a: A) => B,
  ) => IndexedReaderWriterStateT<F, W, S1, S3, R, B> {
    return (f, g) => this.transform(F)((w, s2, a) => [w, f(s2), g(a)]);
  }

  // -- Value Methods

  public map(
    F: Functor<F>,
  ): <B>(f: (a: A) => B) => IndexedReaderWriterStateT<F, W, S1, S2, R, B> {
    return f => this.transform(F)((w, s2, a) => [w, s2, f(a)]);
  }

  public map2<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B, C>(
    that: IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
    f: (a: A, b: B) => C,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, C> {
    return (that, f) => this.flatMap(F)(a => that.map(F)(b => f(a, b)));
  }
  public product<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B>(
    that: IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, [A, B]> {
    return that => this.map2(F)(that, tupled);
  }
  public productL<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B>(
    that: IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, A> {
    return that => this.map2(F)(that, a => a);
  }
  public '<<<'<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B>(
    that: IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, A> {
    return this.productL(F);
  }
  public productR<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B>(
    that: IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, B> {
    return that => this.map2(F)(that, (a, b) => b);
  }
  public '>>>'<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B>(
    that: IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, B> {
    return this.productR(F);
  }

  public flatMap<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <R2, S3, B>(
    f: (a: A) => IndexedReaderWriterStateT<F, W2, S2, S3, R2, B>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R & R2, B> {
    return f =>
      IndexedReaderWriterStateT(
        F.map_(
          this.runAllF,
          rs1ws2a => (r, s1) =>
            F.flatMap_(rs1ws2a(r, s1), ([w, s2, a]) =>
              F.flatMap_(f(a).runAllF, rs2ws3b =>
                F.map_(rs2ws3b(r, s2), ([w2, s3, b]) =>
                  tupled(w['+++'](w2), s3, b),
                ),
              ),
            ),
        ),
      );
  }

  public flatMapF<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: FlatMap<F>,
  ): <B>(
    f: (a: A) => Kind<F, [B]>,
  ) => IndexedReaderWriterStateT<F, W2, S1, S2, R, B> {
    return f =>
      IndexedReaderWriterStateT(
        F.map_(
          this.runAllF,
          rs1ws2a => (r, s1) =>
            F.flatMap_(rs1ws2a(r, s1), ([w, s2, a]) =>
              F.map_(f(a), b => [w, s2, b]),
            ),
        ),
      );
  }

  public transform<W2>(
    this: IndexedReaderWriterStateT<F, W2, S1, S2, R, A>,
    F: Functor<F>,
  ): <S3, B>(
    f: (w: Chain<W2>, s2: S2, a: A) => [Chain<W2>, S3, B],
  ) => IndexedReaderWriterStateT<F, W2, S1, S3, R, B> {
    return f =>
      IndexedReaderWriterStateT(
        F.map_(
          this.runAllF,
          rs1ws2a => (r, s1) => F.map_(rs1ws2a(r, s1), ws2a => f(...ws2a)),
        ),
      );
  }

  public transformF<G>(
    F: Monad<F>,
    G: Applicative<G>,
  ): <W2, S3, B>(
    f: (fcs2a: Kind<F, [[Chain<W>, S2, A]]>) => Kind<G, [[Chain<W2>, S3, B]]>,
  ) => IndexedReaderWriterStateT<G, W2, S1, S3, R, B> {
    return f =>
      IndexedReaderWriterStateT(
        G.pure((r, s1) =>
          f(F.flatMap_(this.runAllF, rs1ws2a => rs1ws2a(r, s1))),
        ),
      );
  }

  // -- Run Methods

  public runStateT(
    this: IndexedReaderWriterStateT<F, unknown, S1, S2, unknown, A>,
    F: FlatMap<F>,
  ): (s1: S1) => Kind<F, [[S2, A]]> {
    return s1 =>
      F.flatMap_(this.runAllF, rs1fws2a =>
        F.map_(rs1fws2a(undefined, s1), ([, s2, a]) => [s2, a]),
      );
  }

  public runWriterT(
    this: IndexedReaderWriterStateT<F, W, unknown, unknown, unknown, A>,
    F: FlatMap<F>,
  ): Kind<F, [[Chain<W>, A]]>;
  public runWriterT<W2>(
    this: IndexedReaderWriterStateT<F, W2, unknown, unknown, unknown, A>,
    F: FlatMap<F>,
    W: Monoid<W2>,
  ): Kind<F, [[W2, A]]>;
  public runWriterT(
    this: IndexedReaderWriterStateT<F, any, unknown, unknown, unknown, A>,
    F: FlatMap<F>,
    W?: Monoid<any>,
  ): Kind<F, [[any, A]]> {
    return F.flatMap_(this.runAllF, rs1f2s2a =>
      F.map_(rs1f2s2a(undefined, undefined), ([w, , a]) =>
        W ? [w.folding(W), a] : [w, a],
      ),
    );
  }

  public runReaderT(
    this: IndexedReaderWriterStateT<F, unknown, unknown, unknown, R, A>,
    F: FlatMap<F>,
  ): (r: R) => Kind<F, [A]> {
    return r =>
      F.flatMap_(this.runAllF, rs1fws2a =>
        F.map_(rs1fws2a(r, undefined), ([, , a]) => a),
      );
  }

  public toKleisli(
    this: IndexedReaderWriterStateT<F, unknown, unknown, unknown, R, A>,
    F: FlatMap<F>,
  ): Kleisli<F, R, A> {
    return Kleisli(this.runReaderT(F));
  }

  public runAll(F: FlatMap<F>): (r: R, s1: S1) => Kind<F, [[Chain<W>, S2, A]]> {
    return (r, s1) => F.flatMap_(this.runAllF, rs1fws2a => rs1fws2a(r, s1));
  }
}

interface IndexedReaderWriterStateTObj {
  <F, W, S1, S2, R, A>(
    frs1fws2a: Kind<F, [(r: R, s1: S1) => Kind<F, [[Chain<W>, S2, A]]>]>,
  ): IndexedReaderWriterStateT<F, W, S1, S2, R, A>;

  pure<F>(
    F: Applicative<F>,
  ): <A, W = never, S = unknown, R = unknown>(
    a: A,
  ) => IndexedReaderWriterStateT<F, W, S, S, R, A>;
  ask<F>(
    F: Applicative<F>,
  ): <R, W = never, S = unknown>() => IndexedReaderWriterStateT<
    F,
    W,
    S,
    S,
    R,
    R
  >;
  tell<F>(
    F: Applicative<F>,
  ): <W, S = unknown, R = unknown>(
    w: W,
  ) => IndexedReaderWriterStateT<F, W, S, S, R, void>;
  state<F>(
    F: Applicative<F>,
  ): <S1, S2, A, W = unknown, R = unknown>(
    f: (s1: S1) => Kind<F, [[S2, A]]>,
  ) => IndexedReaderWriterStateT<F, W, S1, S2, R, A>;

  // -- Instances

  Functor<F, W, S, R>(
    F: Functor<F>,
  ): Functor<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>>;
  Monad<F, W, S, R>(
    F: Monad<F>,
  ): Monad<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>>;
  MonadError<F, W, S, R, E>(
    F: MonadError<F, E>,
  ): MonadError<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>, E>;
  Profunctor<F, W, R, A>(
    F: Functor<F>,
  ): Profunctor<
    λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
  >;
  Strong<F, W, R, A>(
    F: Functor<F>,
  ): Strong<
    λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
  >;
}

IndexedReaderWriterStateT.pure = F => a =>
  IndexedReaderWriterStateT(F.pure((r, s) => F.pure([Chain.empty, s, a])));
IndexedReaderWriterStateT.ask = F => () =>
  IndexedReaderWriterStateT(F.pure((r, s) => F.pure([Chain.empty, s, r])));
IndexedReaderWriterStateT.tell = F => w =>
  IndexedReaderWriterStateT(F.pure((r, s) => F.pure([Chain(w), s, undefined])));
IndexedReaderWriterStateT.state = F => modify =>
  IndexedReaderWriterStateT(
    F.pure((r, s) => F.map_(modify(s), ([s2, a]) => [Chain.empty, s2, a])),
  );

// -- Instances

const irwstFunctor: <F, W, S, R>(
  F: Functor<F>,
) => Functor<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>> = F =>
  Functor.of({ map_: (fa, f) => fa.map(F)(f) });

const irwstMonad: <F, W, S, R>(
  F: Monad<F>,
) => Monad<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>> = <F, W, S, R>(
  F: Monad<F>,
) =>
  Monad.of<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>>({
    ...irwstFunctor(F),
    pure: a =>
      IndexedReaderWriterStateT(F.pure((r, s) => F.pure([Chain.empty, s, a]))),
    flatMap_: (fa, f) => fa.flatMap(F)(f),
    map2_: (fa, fb) => f => fa.map2(F)(fb, f),
    product_: (fa, fb) => fa.product(F)(fb),
    productL_: (fa, fb) => fa['<<<'](F)(fb),
    productR_: (fa, fb) => fa['>>>'](F)(fb),
    tailRecM_: <X, A>(
      initX: X,
      f: (x: X) => IndexedReaderWriterStateT<F, W, S, S, R, Either<X, A>>,
    ) =>
      IndexedReaderWriterStateT(
        F.pure((r: R, initS: S) =>
          F.tailRecM(tupled(Chain.empty as Chain<W>, initS, initX))(
            ([w, s, x]): Kind<
              F,
              [Either<[Chain<W>, S, X], [Chain<W>, S, A]>]
            > =>
              F.flatMap_(f(x).runAllF, rswsxa =>
                F.map_(rswsxa(r, s), ([w2, s, xa]) =>
                  xa.fold(
                    x => Left([w['+++'](w2), s, x]),
                    a => Right([w['+++'](w2), s, a]),
                  ),
                ),
              ),
          ),
        ),
      ),
  });

const irwstMonadError: <F, W, S, R, E>(
  F: MonadError<F, E>,
) => MonadError<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>, E> = <
  F,
  W,
  S,
  R,
  E,
>(
  F: MonadError<F, E>,
): MonadError<$<IndexedReaderWriterStateTF, [F, W, S, S, R]>, E> =>
  MonadError.of({
    ...irwstMonad(F),
    throwError: <A>(e: E) =>
      IndexedReaderWriterStateT<F, W, S, S, R, A>(F.throwError(e)),
    handleErrorWith_: <A>(
      fa: IndexedReaderWriterStateT<F, W, S, S, R, A>,
      f: (e: E) => IndexedReaderWriterStateT<F, W, S, S, R, A>,
    ) =>
      IndexedReaderWriterStateT(
        F.pure((r: R, s: S) =>
          F.handleErrorWith_(fa.runAll(F)(r, s), e => f(e).runAll(F)(r, s)),
        ),
      ),
  });

const irwstProfunctor: <F, W, R, A>(
  F: Functor<F>,
) => Profunctor<
  λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
> = <F, W, R, A>(
  F: Functor<F>,
): Profunctor<
  λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
> =>
  Profunctor.of<
    λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
  >({
    dimap_: (fa, f, g) => fa.dimap(F)(f, g),
  });

const irwstStrong: <F, W, R, A>(
  F: Functor<F>,
) => Strong<
  λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
> = <F, W, R, A>(
  F: Functor<F>,
): Strong<
  λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
> =>
  Strong.of<
    λ<IndexedReaderWriterStateTF, [Fix<F>, Fix<W>, α, β, Fix<R>, Fix<A>]>
  >({
    ...irwstProfunctor(F),
    first:
      <C>() =>
      <S1, S2>(
        fa: IndexedReaderWriterStateT<F, W, S1, S2, R, A>,
      ): IndexedReaderWriterStateT<F, W, [S1, C], [S2, C], R, A> =>
        IndexedReaderWriterStateT(
          F.map_(
            fa.runAllF,
            rs1fws2a =>
              (r: R, [s1, c]: [S1, C]) =>
                F.map_(rs1fws2a(r, s1), ([w, s2, a]) =>
                  tupled(w, tupled(s2, c), a),
                ),
          ),
        ),
    second:
      <C>() =>
      <S1, S2>(
        fa: IndexedReaderWriterStateT<F, W, S1, S2, R, A>,
      ): IndexedReaderWriterStateT<F, W, [C, S1], [C, S2], R, A> =>
        IndexedReaderWriterStateT(
          F.map_(
            fa.runAllF,
            rs1fws2a =>
              (r: R, [c, s1]: [C, S1]) =>
                F.map_(rs1fws2a(r, s1), ([w, s2, a]) =>
                  tupled(w, tupled(c, s2), a),
                ),
          ),
        ),
  });

IndexedReaderWriterStateT.Functor = irwstFunctor;
IndexedReaderWriterStateT.Monad = irwstMonad;
IndexedReaderWriterStateT.MonadError = irwstMonadError;
IndexedReaderWriterStateT.Profunctor = irwstProfunctor;
IndexedReaderWriterStateT.Strong = irwstStrong;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IndexedReaderWriterStateTF extends TyK {
  [$type]: IndexedReaderWriterStateT<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>,
    TyVar<this, 5>
  >;
}
