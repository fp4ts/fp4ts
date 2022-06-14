// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Fix,
  lazyVal,
  snd,
  tupled,
  TyK,
  TyVar,
  α,
  β,
  λ,
} from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import {
  Monad,
  StackSafeMonad,
  SemigroupK,
  MonadError,
  Profunctor,
  Bifunctor,
} from '@fp4ts/cats-core';
import { Chain, Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { MonadReader } from '../monad-reader';
import { MonadState } from '../monad-state';
import { MonadWriter } from '../monad-writer';

export type IndexedReaderWriterState<W, S1, S2, R, E, A> = _RWS<
  W,
  S1,
  S2,
  R,
  E,
  A
>;
export const IndexedReaderWriterState: ReaderWriterStateObj = function <
  W,
  S1,
  S2,
  R,
  E,
  A,
>(
  runAll: (r: R, s1: S1) => [W, Either<E, [S2, A]>],
): IndexedReaderWriterState<W, S1, S2, R, E, A> {
  return IndexedReaderWriterState.ask<R, W, S1>()
    .product(IndexedReaderWriterState.state((s1: S1) => [s1, s1]))
    .flatMap(args => {
      const [w, ea] = runAll(...args);
      return ea.fold(
        e => IndexedReaderWriterState.throwError(e),
        sa => IndexedReaderWriterState.tell(w).state(() => sa),
      );
    });
};

export { IndexedReaderWriterState as RWS };
export { IndexedReaderWriterStateF as RWSF };

abstract class _RWS<out W, in S1, out S2, in R, out E, out A> {
  // -- Reader Methods

  public provide(r: R): IndexedReaderWriterState<W, S1, S2, unknown, E, A> {
    return new Provide(this, r);
  }

  public ask<R2>(): IndexedReaderWriterState<W, S1, S2, R & R2, E, R2> {
    return this.productR(IndexedReaderWriterState.ask<R2>());
  }

  public local<R0>(
    f: (r0: R0) => R,
  ): IndexedReaderWriterState<W, S1, S2, R0, E, A> {
    return IndexedReaderWriterState.ask<R0>().flatMap(r0 =>
      this.provide(f(r0)),
    );
  }

  // -- Writer Methods

  public tell<WW>(
    this: IndexedReaderWriterState<WW, S1, S2, R, E, A>,
    w: WW,
  ): IndexedReaderWriterState<WW, S1, S2, R, E, A> {
    return this.flatMap(a => IndexedReaderWriterState.tell(w).map(() => a));
  }
  public log<WW>(
    this: IndexedReaderWriterState<WW, S1, S2, R, E, A>,
    w: WW,
  ): IndexedReaderWriterState<WW, S1, S2, R, E, A> {
    return this.tell(w);
  }

  public listen(): IndexedReaderWriterState<W, S1, S2, R, E, [Chain<W>, A]>;
  public listen<WW>(
    this: IndexedReaderWriterState<WW, S1, S2, R, E, A>,
    W: Monoid<WW>,
  ): IndexedReaderWriterState<WW, S1, S2, R, E, [WW, A]>;
  public listen(
    W?: Monoid<any>,
  ): IndexedReaderWriterState<any, S1, S2, R, E, [any, A]> {
    return W
      ? this.map2(IndexedReaderWriterState.written(), (a, b) => [
          b.folding(W),
          a,
        ])
      : this.map2(IndexedReaderWriterState.written(), (a, b) => [b, a]);
  }

  public written(): IndexedReaderWriterState<W, S1, S2, R, E, Chain<W>>;
  public written<WW>(
    this: IndexedReaderWriterState<WW, S1, S2, R, E, A>,
    W: Monoid<WW>,
  ): IndexedReaderWriterState<WW, S1, S2, R, E, W>;
  public written(
    W?: Monoid<any>,
  ): IndexedReaderWriterState<W, S1, S2, R, E, any> {
    return W
      ? this.map2(IndexedReaderWriterState.written(), (a, b) => b.folding(W))
      : this.productR(IndexedReaderWriterState.written());
  }

  public censor<WW>(
    this: IndexedReaderWriterState<WW, S1, S2, R, E, A>,
    f: (w: Chain<WW>) => Chain<WW>,
  ): IndexedReaderWriterState<WW, S1, S2, R, E, A> {
    return new Censor(this, f);
  }

  public reset(): IndexedReaderWriterState<W, S1, S2, R, E, A> {
    return this.censor(() => Chain.empty);
  }

  // -- State Methods

  public state<S3, B>(
    this: IndexedReaderWriterState<W, S1, S2, R, E, A>,
    f: (s2: S2) => [S3, B],
  ): IndexedReaderWriterState<W, S1, S3, R, E, B> {
    return this.productR(IndexedReaderWriterState.state(f));
  }

  public modify<S3>(
    f: (s2: S2) => S3,
  ): IndexedReaderWriterState<W, S1, S3, R, E, A> {
    return this.flatMap(a => IndexedReaderWriterState.state(s2 => [f(s2), a]));
  }
  public contramap<S0>(
    f: (s0: S0) => S1,
  ): IndexedReaderWriterState<W, S0, S2, R, E, A> {
    return IndexedReaderWriterState.state((s0: S0) => [
      f(s0),
      undefined,
    ]).productR(this);
  }

  public dimap<S0, S3>(
    f: (s0: S0) => S1,
    g: (s2: S2) => S3,
  ): IndexedReaderWriterState<W, S0, S3, R, E, A> {
    return this.contramap(f).modify(g);
  }

  public provideState(
    s1: S1,
  ): IndexedReaderWriterState<W, unknown, S2, R, E, A> {
    return this.contramap(() => s1);
  }

  public get<S>(
    this: IndexedReaderWriterState<W, S, S, R, E, A>,
  ): IndexedReaderWriterState<W, S, S, R, E, S> {
    return this.state(s => [s, s]);
  }

  public replace<S22>(
    this: IndexedReaderWriterState<W, S1, S22, R, E, A>,
    s: S22,
  ): IndexedReaderWriterState<W, S1, S22, R, E, void> {
    return this.state(() => [s, undefined]);
  }

  public bimap<S3, B>(
    f: (s2: S2) => S3,
    g: (a: A) => B,
  ): IndexedReaderWriterState<W, S1, S3, R, E, B> {
    return this.flatMap(a =>
      IndexedReaderWriterState.state(s2 => [f(s2), g(a)]),
    );
  }

  // -- Value Methods

  public map<B>(f: (a: A) => B): IndexedReaderWriterState<W, S1, S2, R, E, B> {
    return new Map(this, f);
  }

  public get void(): IndexedReaderWriterState<W, S1, S2, R, E, void> {
    return this.map(() => {});
  }

  public map2<W2, S22, S3, R2, E2, B, C>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    that: IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
    f: (a: A, b: B) => C,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, C> {
    return this.flatMap(a => that.map(b => f(a, b)));
  }

  public product<W2, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    that: IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, [A, B]> {
    return this.map2(that, tupled);
  }

  public productL<W2, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    that: IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, A> {
    return this.map2(that, a => a);
  }
  public '<<<'<W2, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    that: IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, A> {
    return this.productL(that);
  }
  public productR<W2, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    that: IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, B> {
    return this.map2(that, (a, b) => b);
  }
  public '>>>'<W2, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    that: IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, B> {
    return this.productR(that);
  }

  public flatMap<W2, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    fun: (a: A) => IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<W2, S1, S3, R & R2, E2, B> {
    return new FlatMap(this, fun);
  }

  // -- Error Handling

  public fold<WW, S22, S3, R2, E2, B>(
    this: IndexedReaderWriterState<WW, S1, S22, R & R2, E, A>,
    onFailure: (e: E) => IndexedReaderWriterState<WW, S1, S3, R2, E2, B>,
    onSuccess: (a: A) => IndexedReaderWriterState<WW, S22, S3, R2, E2, B>,
  ): IndexedReaderWriterState<WW, S1, S3, R & R2, E2, B> {
    return new Fold(this, onFailure, onSuccess);
  }

  public get attempt(): IndexedReaderWriterState<
    W,
    S1,
    S2,
    R,
    never,
    Either<E, A>
  > {
    return this.fold(
      e => IndexedReaderWriterState.pure(Left(e)),
      a => IndexedReaderWriterState.pure(Right(a)),
    );
  }

  public orElse<WW, S1, S22, R2, E2, B>(
    this: IndexedReaderWriterState<WW, S1, S22, R, E2, B>,
    that: IndexedReaderWriterState<WW, S1, S22, R2, E2, B>,
  ): IndexedReaderWriterState<WW, S1, S22, R & R2, E2, B> {
    return this.fold(() => that, IndexedReaderWriterState.pure);
  }
  public '<|>'<WW, S22, R2, E2, B>(
    this: IndexedReaderWriterState<WW, S1, S22, R, E2, B>,
    that: IndexedReaderWriterState<WW, S1, S22, R2, E2, B>,
  ): IndexedReaderWriterState<WW, S1, S22, R & R2, E2, B> {
    return this.orElse(that);
  }

  public handleErrorWith<W2, S22, R2, E2, E3, B>(
    this: IndexedReaderWriterState<W2, S1, S22, R, E2, B>,
    f: (e: E2) => IndexedReaderWriterState<W2, S1, S22, R2, E3, B>,
  ): IndexedReaderWriterState<W2, S1, S22, R & R2, E3, B> {
    return this.fold(
      e => f(e),
      a => IndexedReaderWriterState.pure(a),
    );
  }

  public handleError<B>(
    this: IndexedReaderWriterState<W, S1, S2, R, E, B>,
    f: (e: E) => B,
  ): IndexedReaderWriterState<W, S1, S2, R, never, B> {
    return this.handleErrorWith(e => IndexedReaderWriterState.pure(f(e)));
  }

  // -- Running the Effects

  public runA(
    this: IndexedReaderWriterState<
      unknown,
      unknown,
      unknown,
      unknown,
      never,
      A
    >,
  ): A {
    return this.runAll(undefined, undefined)[1].get[1];
  }
  public runEA(
    this: IndexedReaderWriterState<unknown, unknown, unknown, unknown, E, A>,
  ): Either<E, A> {
    return this.runAll(undefined, undefined)[1].map(snd);
  }

  public runStateA(
    this: IndexedReaderWriterState<unknown, S1, S2, unknown, never, A>,
    s1: S1,
  ): A {
    return this.runState(s1)[1];
  }
  public runStateS(
    this: IndexedReaderWriterState<unknown, S1, S2, unknown, never, A>,
    s1: S1,
  ): S2 {
    return this.runState(s1)[0];
  }
  public runState(
    this: IndexedReaderWriterState<unknown, S1, S2, unknown, never, A>,
    s1: S1,
  ): [S2, A] {
    return this.runAll(undefined, s1)[1].get;
  }

  public runWriter(
    this: IndexedReaderWriterState<W, unknown, unknown, unknown, never, A>,
  ): [Chain<W>, A];
  public runWriter<WW>(
    this: IndexedReaderWriterState<WW, unknown, unknown, unknown, never, A>,
    W: Monoid<WW>,
  ): [WW, A];
  public runWriter(
    this: IndexedReaderWriterState<any, unknown, unknown, unknown, never, A>,
    W?: Monoid<any>,
  ): [any, A] {
    const [w, ea] = this.runAll(undefined, undefined);
    return W ? [w.folding(W), ea.get[1]] : [w, ea.get[1]];
  }

  public runReader(
    this: IndexedReaderWriterState<unknown, unknown, unknown, R, never, A>,
    r: R,
  ): A {
    return this.runAll(r, undefined)[1].get[1];
  }

  public runAll(r: R, s1: S1): [Chain<W>, Either<E, [S2, A]>] {
    type AnyXPure = IndexedReaderWriterState<
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown
    >;
    type Frame = (a: unknown) => unknown;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let _cur: AnyXPure = this as AnyXPure;
    let env: unknown = r;
    const envStack: unknown[] = [];
    let state: unknown = s1;
    let log: Chain<unknown> = Chain.empty;
    const stack: Frame[] = [];
    const conts: Cont[] = [];

    runLoop: while (true) {
      // eslint-disable-next-line prettier/prettier
      const cur = _cur as View<unknown, unknown, unknown, unknown, unknown, unknown>;
      type Res = Pure<unknown> | Fail<unknown>;
      let res: Res;

      switch (cur.tag) {
        case 'pure':
        case 'fail':
          res = cur;
          break;
        case 'ask':
          _cur = new Pure(env);
          continue;
        case 'provide':
          conts.push(Cont.Provide);
          envStack.push(env);
          env = cur.r;
          _cur = cur.self;
          continue;
        case 'tell':
          log = log.append(cur.w);
          _cur = new Pure(undefined);
          continue;
        case 'written':
          _cur = new Pure(log);
          continue;
        case 'censor':
          conts.push(Cont.Censor);
          stack.push(cur.fun as any);
          _cur = cur.self;
          continue;
        case 'state': {
          const sa = cur.fun(state);
          state = sa[0];
          _cur = new Pure(sa[1]);
          continue;
        }
        case 'map':
          conts.push(Cont.Map);
          stack.push(cur.fun);
          _cur = cur.self;
          continue;
        case 'flatMap':
          conts.push(Cont.FlatMap);
          stack.push(cur.fun);
          _cur = cur.self;
          continue;
        case 'fold':
          conts.push(Cont.Fold);
          stack.push(ea =>
            (ea as Either<unknown, unknown>).fold(cur.onFailure, cur.onSuccess),
          );
          _cur = cur.self;
          continue;
      }

      while (true) {
        if (res.tag === 'pure') {
          while (true) {
            const c = conts.pop();
            if (c == null)
              return [log as Chain<W>, Right([state as S2, res.value as A])];

            switch (c) {
              case Cont.Map:
                res = new Pure(stack.pop()!(res.value));
                continue;
              case Cont.FlatMap:
                _cur = stack.pop()!(res.value) as AnyXPure;
                continue runLoop;
              case Cont.Fold:
                _cur = stack.pop()!(Right(res.value)) as AnyXPure;
                continue runLoop;
              case Cont.Provide:
                env = envStack.pop()!;
                continue;
              case Cont.Censor:
                log = stack.pop()!(log) as Chain<unknown>;
                continue;
            }
          }
        } else {
          while (true) {
            const c = conts.pop();
            if (c == null) return [log as Chain<W>, Left(res.error as E)];

            switch (c) {
              case Cont.Map:
              case Cont.FlatMap:
              case Cont.Censor:
                stack.pop();
                continue;
              case Cont.Fold:
                _cur = stack.pop()!(Left(res.error)) as AnyXPure;
                continue runLoop;
              case Cont.Provide:
                env = envStack.pop()!;
                continue;
            }
          }
        }
      }
    }
  }
}

interface ReaderWriterStateObj {
  /* eslint-disable prettier/prettier */
  <W, S1, S2, R, E, A>(
    runAll: (r: R, s1: S1) => [W, Either<E, [S2, A]>],
  ): IndexedReaderWriterState<W, S1, S2, R, E, A>;
  pure<A, W = never, S1 = unknown, S2 = never, R = unknown, E = never>(a: A): IndexedReaderWriterState<W, S1, S2, R, E, A>;
  throwError<E, W = never, S1 = unknown, S2 = never, R = unknown, A = never>(e: E): IndexedReaderWriterState<W, S1, S2, R, E, A>;

  ask<R, W = never, S1 = unknown, S2 = never, E = never>(): IndexedReaderWriterState<W, S1, S2, R, E, R>;
  tell<W, S1 = unknown, S2 = never, R = unknown, E = never>(w: W): IndexedReaderWriterState<W, S1, S2, R, E, void>;
  written<W, S1 = unknown, S2 = never, R = unknown, E = never>(): IndexedReaderWriterState<W, S1, S2, R, E, Chain<W>>;
  state<S1, S2, A, W = never, R = unknown, E = never>(modify: (s1: S1) => [S2, A]): IndexedReaderWriterState<W, S1, S2, R, E, A>;
  /* eslint-enable prettier/prettier */

  // -- Instances

  SemigroupK<W, S, R, E>(): SemigroupK<
    $<IndexedReaderWriterStateF, [W, S, S, R, E]>
  >;
  Monad<W, S, R, E>(): Monad<$<IndexedReaderWriterStateF, [W, S, S, R, E]>>;
  MonadError<W, S, R, E>(): MonadError<
    $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
    E
  >;
  // WriterBifunctor<S, R, E>(): Bifunctor<
  //   λ<XPureF, [α, Fix<S>, Fix<S>, Fix<R>, Fix<E>, β]>
  // >;
  StateBifunctor<W, S1, R, E>(): Bifunctor<
    λ<IndexedReaderWriterStateF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
  >;
  Profunctor<W, R, E, A>(): Profunctor<
    λ<IndexedReaderWriterStateF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
  >;

  MonadReader<W, S, R, E>(): MonadReader<
    $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
    R
  >;
  MonadState<W, S, R, E>(): MonadState<
    $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
    S
  >;
  MonadWriter<W, S, R, E>(
    W: Monoid<W>,
  ): MonadWriter<$<IndexedReaderWriterStateF, [W, S, S, R, E]>, W>;
}

IndexedReaderWriterState.pure = a => new Pure(a);
IndexedReaderWriterState.throwError = e => new Fail(e);
IndexedReaderWriterState.ask = () => new Ask();
IndexedReaderWriterState.tell = w => new Tell(w);
IndexedReaderWriterState.state = modify => new State(modify);
IndexedReaderWriterState.written = () => new Written();

// -- Instances

const rwsSemigroupK: <W, S, R, E>() => SemigroupK<
  $<IndexedReaderWriterStateF, [W, S, S, R, E]>
> = lazyVal(() => SemigroupK.of({ combineK_: (l, r) => l['<|>'](r()) }));

const rwsMonad: <W, S, R, E>() => Monad<
  $<IndexedReaderWriterStateF, [W, S, S, R, E]>
> = lazyVal(<W, S, R, E>() =>
  StackSafeMonad.of<$<IndexedReaderWriterStateF, [W, S, S, R, E]>>({
    map_: (fa, f) => fa.map(f),
    pure: x => IndexedReaderWriterState.pure(x),
    flatMap_: (fa, f) => fa.flatMap(f),
    map2_:
      <A, B>(
        fa: IndexedReaderWriterState<W, S, S, R, E, A>,
        fb: IndexedReaderWriterState<W, S, S, R, E, B>,
      ) =>
      <C>(f: (a: A, b: B) => C) =>
        fa.map2(fb, f),
    product_: (fa, fb) => fa.product(fb),
    productL_: (fa, fb) => fa['<<<'](fb),
    productR_: (fa, fb) => fa['>>>'](fb),
  }),
) as <W, S, R, E>() => Monad<$<IndexedReaderWriterStateF, [W, S, S, R, E]>>;

const rwsMonadError: <W, S, R, E>() => MonadError<
  $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
  E
> = lazyVal(<W, S, R, E>() =>
  MonadError.of<$<IndexedReaderWriterStateF, [W, S, S, R, E]>, E>({
    ...rwsMonad(),
    throwError: <A>(e: E) =>
      IndexedReaderWriterState.throwError<E, W, S, S, R, A>(e),
    handleErrorWith_: (fa, f) => fa.handleErrorWith(f),
    handleError_: (fa, f) => fa.handleError(f),
    attempt: fa => fa.attempt,
  }),
) as <W, S, R, E>() => MonadError<
  $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
  E
>;

const rwsStateBifunctor: <W, S1, R, E>() => Bifunctor<
  λ<IndexedReaderWriterStateF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
> = lazyVal(<W, S1, R, E>() =>
  Bifunctor.of<
    λ<IndexedReaderWriterStateF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
  >({
    bimap_: (fab, f, g) => fab.bimap(f, g),
  }),
) as <W, S1, R, E>() => Bifunctor<
  λ<IndexedReaderWriterStateF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
>;

// const xpureWriterBifunctor: <S1, S2, R, E>() => Bifunctor<
//   λ<XPureF, [α, Fix<S1>, Fix<S2>, Fix<R>, Fix<E>, β]>
// > = lazyVal(<S1, S2, R, E>() =>
//   Bifunctor.of<λ<XPureF, [α, Fix<S1>, Fix<S2>, Fix<R>, Fix<E>, β]>>({
//     bimap_: (fab, f, g) => fab.bimap(f, g),
//   }),
// ) as <W, S1, R, E>() => Bifunctor<
//   λ<XPureF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
// >;

const rwsProfunctor: <W, R, E, A>() => Profunctor<
  λ<IndexedReaderWriterStateF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
> = lazyVal(<W, R, E, A>() =>
  Profunctor.of<
    λ<IndexedReaderWriterStateF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
  >({
    dimap_: (fab, f, g) => fab.dimap(f, g),
  }),
) as <W, R, E, A>() => Profunctor<
  λ<IndexedReaderWriterStateF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
>;

const rwsMonadReader = <W, S, R, E>(): MonadReader<
  $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
  R
> =>
  MonadReader.of<$<IndexedReaderWriterStateF, [W, S, S, R, E]>, R>({
    ...IndexedReaderWriterState.Monad<W, S, R, E>(),
    ask: (() => IndexedReaderWriterState.ask()) as MonadReader<
      $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
      R
    >['ask'],
    local_: (fa, f) => fa.local(f),
  });
const rwsMonadState = <W, S, R, E>(): MonadState<
  $<IndexedReaderWriterStateF, [W, S, S, R, E]>,
  S
> =>
  MonadState.of({
    ...IndexedReaderWriterState.Monad<W, S, R, E>(),
    get: IndexedReaderWriterState.state(s => [s, s]),
    set: s => IndexedReaderWriterState.state(() => [s, undefined]),
    modify: f => IndexedReaderWriterState.state(s => [f(s), undefined]),
    inspect: f => IndexedReaderWriterState.state(s => [s, f(s)]),
  });
const rwsMonadWriter = <W, S, R, E>(
  W: Monoid<W>,
): MonadWriter<$<IndexedReaderWriterStateF, [W, S, S, R, E]>, W> =>
  MonadWriter.of({
    monoid: W,
    ...IndexedReaderWriterState.Monad<W, S, R, E>(),

    censor_: (fa, f) => fa.censor(chain => Chain(f(chain.folding(W)))),
    listen: fa => fa.listen(W),
    tell: w => IndexedReaderWriterState.tell(w),
  });

IndexedReaderWriterState.SemigroupK = rwsSemigroupK;
IndexedReaderWriterState.Monad = rwsMonad;
IndexedReaderWriterState.MonadError = rwsMonadError;
IndexedReaderWriterState.StateBifunctor = rwsStateBifunctor;
IndexedReaderWriterState.Profunctor = rwsProfunctor;
IndexedReaderWriterState.MonadReader = rwsMonadReader;
IndexedReaderWriterState.MonadState = rwsMonadState;
IndexedReaderWriterState.MonadWriter = rwsMonadWriter;

// -- Algebra

class Pure<A> extends _RWS<never, unknown, never, unknown, never, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

class Fail<E> extends _RWS<never, unknown, never, unknown, E, never> {
  public readonly tag = 'fail';
  public constructor(public readonly error: E) {
    super();
  }
}

class Ask<R> extends _RWS<never, unknown, never, R, never, R> {
  public readonly tag = 'ask';
}

class Provide<W, S1, S2, R, E, A> extends _RWS<W, S1, S2, unknown, E, A> {
  public readonly tag = 'provide';

  public constructor(
    public readonly self: IndexedReaderWriterState<W, S1, S2, R, E, A>,
    public readonly r: R,
  ) {
    super();
  }
}

class Tell<W> extends _RWS<W, unknown, never, unknown, never, void> {
  public readonly tag = 'tell';
  public constructor(public readonly w: W) {
    super();
  }
}

class Written<W> extends _RWS<W, unknown, never, unknown, never, Chain<W>> {
  public readonly tag = 'written';
}

class Censor<W, S1, S2, R, E, A> extends _RWS<W, S1, S2, R, E, A> {
  public readonly tag = 'censor';
  public constructor(
    public readonly self: IndexedReaderWriterState<W, S1, S2, R, E, A>,
    public readonly fun: (w: Chain<W>) => Chain<W>,
  ) {
    super();
  }
}

class State<S1, S2, A> extends _RWS<never, S1, S2, unknown, never, A> {
  public readonly tag = 'state';
  public constructor(public readonly fun: (s: S1) => [S2, A]) {
    super();
  }
}

class Map<W, S1, S2, R, E, A, B> extends _RWS<W, S1, S2, R, E, B> {
  public readonly tag = 'map';

  public constructor(
    public readonly self: IndexedReaderWriterState<W, S1, S2, R, E, A>,
    public readonly fun: (a: A) => B,
  ) {
    super();
  }
}

class Fold<W, S1, S2, S3, R, R2, E1, E2, A, B> extends _RWS<
  W,
  S1,
  S3,
  R & R2,
  E2,
  B
> {
  public readonly tag = 'fold';
  public constructor(
    public readonly self: IndexedReaderWriterState<W, S1, S2, R, E1, A>,
    public readonly onFailure: (
      e: E1,
    ) => IndexedReaderWriterState<W, S1, S3, R2, E2, B>,
    public readonly onSuccess: (
      a: A,
    ) => IndexedReaderWriterState<W, S2, S3, R2, E2, B>,
  ) {
    super();
  }
}

class FlatMap<S1, R, A, W2, S22, S3, R2, E2, B> extends _RWS<
  W2,
  S1,
  S3,
  R & R2,
  E2,
  B
> {
  public readonly tag = 'flatMap';

  public constructor(
    public readonly self: IndexedReaderWriterState<W2, S1, S22, R, E2, A>,
    public readonly fun: (
      a: A,
    ) => IndexedReaderWriterState<W2, S22, S3, R2, E2, B>,
  ) {
    super();
  }
}

type View<W, S1, S2, R, E, A> =
  | Pure<A>
  | Fail<E>
  | Tell<W>
  | Ask<R>
  | Written<W>
  | Provide<W, S1, S2, R, E, A>
  | Censor<W, S1, S2, R, E, A>
  | State<S1, S2, A>
  | Map<W, S1, S2, R, E, any, A>
  | Fold<W, S1, any, S2, R, any, any, E, any, A>
  | FlatMap<S1, R, any, W, any, S2, R, E, A>;

enum Cont {
  Map,
  FlatMap,
  Censor,
  Fold,
  Provide,
}

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IndexedReaderWriterStateF extends TyK {
  [$type]: IndexedReaderWriterState<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>,
    TyVar<this, 5>
  >;
}
