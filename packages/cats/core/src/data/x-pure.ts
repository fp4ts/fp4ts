// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Fix,
  fst,
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
import { Monad } from '../monad';
import { StackSafeMonad } from '../stack-safe-monad';
import { SemigroupK } from '../semigroup-k';
import { MonadError } from '../monad-error';
import { Profunctor } from '../arrow';
import { Bifunctor } from '../bifunctor';

import { Chain } from './collections';
import { Either, Left, Right } from './either';

export type XPure<W, S1, S2, R, E, A> = _XPure<W, S1, S2, R, E, A>;
export const XPure: XPureObj = function (a) {
  return new Pure(a);
};

abstract class _XPure<W, S1, S2, R, E, A> {
  // -- Reader Methods

  public provide(r: R): XPure<W, S1, S2, unknown, E, A> {
    return new Provide(this, r);
  }

  public ask<R2>(): XPure<W, S1, S2, R & R2, E, R2> {
    return this.productR(XPure.read<R2>());
  }

  public local<R0>(f: (r0: R0) => R): XPure<W, S1, S2, R0, E, A> {
    return XPure.read<R0>().flatMap(r0 => this.provide(f(r0)));
  }

  // -- Writer Methods

  public tell<WW>(
    this: XPure<WW, S1, S2, R, E, A>,
    w: WW,
  ): XPure<WW, S1, S2, R, E, A> {
    return this.flatMap(a => XPure.tell(w).map(() => a));
  }
  public log<WW>(
    this: XPure<WW, S1, S2, R, E, A>,
    w: WW,
  ): XPure<WW, S1, S2, R, E, A> {
    return this.tell(w);
  }

  public listen(): XPure<W, S1, S2, R, E, [Chain<W>, A]>;
  public listen<WW>(
    this: XPure<WW, S1, S2, R, E, A>,
    W: Monoid<WW>,
  ): XPure<WW, S1, S2, R, E, [WW, A]>;
  public listen(W?: Monoid<any>): XPure<any, S1, S2, R, E, [any, A]> {
    return W
      ? this.map2(XPure.written(), (a, b) => [
          b.foldLeft(W.empty, (b, a) => W.combine_(a, () => b)),
          a,
        ])
      : this.map2(XPure.written(), (a, b) => [b, a]);
  }

  public written(): XPure<W, S1, S2, R, E, Chain<W>>;
  public written<WW>(
    this: XPure<WW, S1, S2, R, E, A>,
    W: Monoid<WW>,
  ): XPure<WW, S1, S2, R, E, W>;
  public written(W?: Monoid<any>): XPure<W, S1, S2, R, E, any> {
    return W
      ? this.map2(XPure.written(), (a, b) =>
          b.foldLeft(W.empty, (b, a) => W.combine_(a, () => b)),
        )
      : this.productR(XPure.written());
  }

  // -- State Methods

  public modify<S3, B>(
    this: XPure<W, S1, S2, R, E, A>,
    f: (s2: S2) => [S3, B],
  ): XPure<W, S1, S3, R, E, B> {
    return this.flatMap(() => XPure.modify(f));
  }

  public mapState<S3>(f: (s2: S2) => S3): XPure<W, S1, S3, R, E, A> {
    return this.flatMap(a => XPure.modify(s2 => [f(s2), a]));
  }
  public contramapState<S0>(f: (s0: S0) => S1): XPure<W, S0, S2, R, E, A> {
    return XPure.modify((s0: S0) => [f(s0), undefined]).productR(this);
  }

  public dimap<S0, S3>(
    f: (s0: S0) => S1,
    g: (s2: S2) => S3,
  ): XPure<W, S0, S3, R, E, A> {
    return this.contramapState(f).mapState(g);
  }

  public provideState(s1: S1): XPure<W, unknown, S2, R, E, A> {
    return this.contramapState(() => s1);
  }

  public get<S>(this: XPure<W, S, S, R, E, A>): XPure<W, S, S, R, E, S> {
    return this.modify(s => [s, s]);
  }

  public replace<S22>(
    this: XPure<W, S1, S22, R, E, A>,
    s: S22,
  ): XPure<W, S1, S22, R, E, void> {
    return this.modify(() => [s, undefined]);
  }

  public bimap<S3, B>(
    f: (s2: S2) => S3,
    g: (a: A) => B,
  ): XPure<W, S1, S3, R, E, B> {
    return this.flatMap(a => XPure.modify(s2 => [f(s2), g(a)]));
  }

  // -- Value Methods

  public map<B>(f: (a: A) => B): XPure<W, S1, S2, R, E, B> {
    return new Map(this, f);
  }

  public map2<W2, S22, S3, R2, E2, B, C>(
    this: XPure<W2, S1, S22, R, E2, A>,
    that: XPure<W2, S22, S3, R2, E2, B>,
    f: (a: A, b: B) => C,
  ): XPure<W2, S1, S3, R & R2, E2, C> {
    return this.flatMap(a => that.map(b => f(a, b)));
  }

  public product<W2, S22, S3, R2, E2, B>(
    this: XPure<W2, S1, S22, R, E2, A>,
    that: XPure<W2, S22, S3, R2, E2, B>,
  ): XPure<W2, S1, S3, R & R2, E2, [A, B]> {
    return this.map2(that, tupled);
  }

  public productL<W2, S22, S3, R2, E2, B>(
    this: XPure<W2, S1, S22, R, E2, A>,
    that: XPure<W2, S22, S3, R2, E2, B>,
  ): XPure<W2, S1, S3, R & R2, E2, A> {
    return this.map2(that, a => a);
  }
  public '<<<'<W2, S22, S3, R2, E2, B>(
    this: XPure<W2, S1, S22, R, E2, A>,
    that: XPure<W2, S22, S3, R2, E2, B>,
  ): XPure<W2, S1, S3, R & R2, E2, A> {
    return this.productL(that);
  }
  public productR<W2, S22, S3, R2, E2, B>(
    this: XPure<W2, S1, S22, R, E2, A>,
    that: XPure<W2, S22, S3, R2, E2, B>,
  ): XPure<W2, S1, S3, R & R2, E2, B> {
    return this.map2(that, (a, b) => b);
  }
  public '>>>'<W2, S22, S3, R2, E2, B>(
    this: XPure<W2, S1, S22, R, E2, A>,
    that: XPure<W2, S22, S3, R2, E2, B>,
  ): XPure<W2, S1, S3, R & R2, E2, B> {
    return this.productR(that);
  }

  public flatMap<W2, S22, S3, R2, E2, B>(
    this: XPure<W2, S1, S22, R, E2, A>,
    fun: (a: A) => XPure<W2, S22, S3, R2, E2, B>,
  ): XPure<W2, S1, S3, R & R2, E2, B> {
    return new FlatMap(this, fun);
  }

  // -- Error Handling

  public fold<WW, S22, S3, R2, E2, B>(
    this: XPure<WW, S1, S22, R & R2, E, A>,
    onFailure: (e: E) => XPure<WW, S1, S3, R2, E2, B>,
    onSuccess: (a: A) => XPure<WW, S22, S3, R2, E2, B>,
  ): XPure<WW, S1, S3, R & R2, E2, B> {
    return new Fold(this, onFailure, onSuccess);
  }

  public get attempt(): XPure<W, S1, S2, R, never, Either<E, A>> {
    return this.fold(
      e => XPure(Left(e)),
      a => XPure(Right(a)),
    );
  }

  public orElse<WW, S1, S22, R2, E2, B>(
    this: XPure<WW, S1, S22, R, E2, B>,
    that: XPure<WW, S1, S22, R2, E2, B>,
  ): XPure<WW, S1, S22, R & R2, E2, B> {
    return this.fold(() => that, XPure);
  }
  public '<|>'<WW, S22, R2, E2, B>(
    this: XPure<WW, S1, S22, R, E2, B>,
    that: XPure<WW, S1, S22, R2, E2, B>,
  ): XPure<WW, S1, S22, R & R2, E2, B> {
    return this.orElse(that);
  }

  public handleErrorWith<W2, S22, R2, E2, E3, B>(
    this: XPure<W2, S1, S22, R, E2, B>,
    f: (e: E2) => XPure<W2, S1, S22, R2, E3, B>,
  ): XPure<W2, S1, S22, R & R2, E3, B> {
    return this.fold(
      e => f(e),
      a => XPure(a),
    );
  }

  public handleError<B>(
    this: XPure<W, S1, S2, R, E, B>,
    f: (e: E) => B,
  ): XPure<W, S1, S2, R, never, B> {
    return this.handleErrorWith(e => XPure(f(e)));
  }

  // -- Running the Effects

  public runA(this: XPure<W, S1, S2, R, never, A>, r: R, s1: S1): A {
    return this.runAll(r, s1)[1].get[1];
  }
  public runS(this: XPure<W, S1, S2, R, never, A>, r: R, s1: S1): S2 {
    return this.runAll(r, s1)[1].get[0];
  }
  public runSA(this: XPure<W, S1, S2, R, never, A>, r: R, s1: S1): [S2, A] {
    return this.runAll(r, s1)[1].get;
  }
  public runESA(r: R, s1: S1): Either<E, [S2, A]> {
    return this.runAll(r, s1)[1];
  }
  public runEA(r: R, s1: S1): Either<E, A> {
    return this.runAll(r, s1)[1].map(snd);
  }
  public runES(r: R, s1: S1): Either<E, S2> {
    return this.runAll(r, s1)[1].map(fst);
  }
  public runW(r: R, s1: S1): Chain<W>;
  public runW<WW>(
    this: XPure<WW, S1, S2, R, E, A>,
    r: R,
    s1: S1,
    W: Monoid<WW>,
  ): WW;
  public runW(r: R, s1: S1, W?: Monoid<any>): any {
    return W
      ? this.runAll(r, s1)[0].foldLeft(W.empty, (b, a) =>
          W.combine_(a, () => b),
        )
      : this.runAll(r, s1)[0];
  }

  public runAll(r: R, s1: S1): [Chain<W>, Either<E, [S2, A]>] {
    type AnyXPure = XPure<unknown, unknown, unknown, unknown, unknown, unknown>;
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
        case 'modify': {
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
            }
          }
        } else {
          while (true) {
            const c = conts.pop();
            if (c == null) return [log as Chain<W>, Left(res.error as E)];

            switch (c) {
              case Cont.Map:
              case Cont.FlatMap:
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

interface XPureObj {
  /* eslint-disable prettier/prettier */
  <A, W = never, S1 = unknown, S2 = never, R = unknown, E = never>(a: A): XPure<W, S1, S2, R, E, A>;
  pure<A, W = never, S1 = unknown, S2 = never, R = unknown, E = never>(a: A): XPure<W, S1, S2, R, E, A>;
  throwError<E, W = never, S1 = unknown, S2 = never, R = unknown, A = never>(e: E): XPure<W, S1, S2, R, E, A>;

  read<R, W = never, S1 = unknown, S2 = never, E = never>(): XPure<W, S1, S2, R, E, R>;
  tell<W, S1 = unknown, S2 = never, R = unknown, E = never>(w: W): XPure<W, S1, S2, R, E, void>;
  written<W, S1 = unknown, S2 = never, R = unknown, E = never>(): XPure<W, S1, S2, R, E, Chain<W>>;
  modify<S1, S2, A, W = never, R = unknown, E = never>(modify: (s1: S1) => [S2, A]): XPure<W, S1, S2, R, E, A>;
  /* eslint-enable prettier/prettier */

  // -- Instances

  SemigroupK<W, S, R, E>(): SemigroupK<$<XPureF, [W, S, S, R, E]>>;
  Monad<W, S, R, E>(): Monad<$<XPureF, [W, S, S, R, E]>>;
  MonadError<W, S, R, E>(): MonadError<$<XPureF, [W, S, S, R, E]>, E>;
  Bifunctor<W, S1, R, E>(): Bifunctor<
    λ<XPureF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
  >;
  Profunctor<W, R, E, A>(): Profunctor<
    λ<XPureF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
  >;
}

XPure.pure = XPure;
XPure.throwError = e => new Fail(e);
XPure.read = () => new Ask();
XPure.tell = w => new Tell(w);
XPure.modify = modify => new Modify(modify);
XPure.written = () => new Written();

// -- Instances

const xpureSemigroupK: <W, S, R, E>() => SemigroupK<
  $<XPureF, [W, S, S, R, E]>
> = lazyVal(() => SemigroupK.of({ combineK_: (l, r) => l['<|>'](r()) }));

const xpureMonad: <W, S, R, E>() => Monad<$<XPureF, [W, S, S, R, E]>> = lazyVal(
  <W, S, R, E>() =>
    StackSafeMonad.of<$<XPureF, [W, S, S, R, E]>>({
      map_: (fa, f) => fa.map(f),
      pure: x => XPure(x),
      flatMap_: (fa, f) => fa.flatMap(f),
      map2_:
        <A, B>(fa: XPure<W, S, S, R, E, A>, fb: XPure<W, S, S, R, E, B>) =>
        <C>(f: (a: A, b: B) => C) =>
          fa.map2(fb, f),
      product_: (fa, fb) => fa.product(fb),
      productL_: (fa, fb) => fa['<<<'](fb),
      productR_: (fa, fb) => fa['>>>'](fb),
    }),
) as <W, S, R, E>() => Monad<$<XPureF, [W, S, S, R, E]>>;

const xpureMonadError: <W, S, R, E>() => MonadError<
  $<XPureF, [W, S, S, R, E]>,
  E
> = lazyVal(<W, S, R, E>() =>
  MonadError.of<$<XPureF, [W, S, S, R, E]>, E>({
    ...xpureMonad(),
    throwError: <A>(e: E) => XPure.throwError<E, W, S, S, R, A>(e),
    handleErrorWith_: (fa, f) => fa.handleErrorWith(f),
    handleError_: (fa, f) => fa.handleError(f),
    attempt: fa => fa.attempt,
  }),
) as <W, S, R, E>() => MonadError<$<XPureF, [W, S, S, R, E]>, E>;

const xpureBifunctor: <W, S1, R, E>() => Bifunctor<
  λ<XPureF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
> = lazyVal(<W, S1, R, E>() =>
  Bifunctor.of<λ<XPureF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>>({
    bimap_: (fab, f, g) => fab.bimap(f, g),
  }),
) as <W, S1, R, E>() => Bifunctor<
  λ<XPureF, [Fix<W>, Fix<S1>, α, Fix<R>, Fix<E>, β]>
>;

const xpureProfunctor: <W, R, E, A>() => Profunctor<
  λ<XPureF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
> = lazyVal(<W, R, E, A>() =>
  Profunctor.of<λ<XPureF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>>({
    dimap_: (fab, f, g) => fab.dimap(f, g),
  }),
) as <W, R, E, A>() => Profunctor<
  λ<XPureF, [Fix<W>, α, β, Fix<R>, Fix<E>, Fix<A>]>
>;

XPure.SemigroupK = xpureSemigroupK;
XPure.Monad = xpureMonad;
XPure.MonadError = xpureMonadError;
XPure.Bifunctor = xpureBifunctor;
XPure.Profunctor = xpureProfunctor;

// -- Algebra

class Pure<A> extends _XPure<never, unknown, never, unknown, never, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

class Fail<E> extends _XPure<never, unknown, never, unknown, E, never> {
  public readonly tag = 'fail';
  public constructor(public readonly error: E) {
    super();
  }
}

class Ask<R> extends _XPure<never, unknown, never, R, never, R> {
  public readonly tag = 'ask';
}

class Provide<W, S1, S2, R, E, A> extends _XPure<W, S1, S2, unknown, E, A> {
  public readonly tag = 'provide';

  public constructor(
    public readonly self: XPure<W, S1, S2, R, E, A>,
    public readonly r: R,
  ) {
    super();
  }
}

class Tell<W> extends _XPure<W, unknown, never, unknown, never, void> {
  public readonly tag = 'tell';
  public constructor(public readonly w: W) {
    super();
  }
}

class Written<W> extends _XPure<W, unknown, never, unknown, never, Chain<W>> {
  public readonly tag = 'written';
}

class Modify<S1, S2, A> extends _XPure<never, S1, S2, unknown, never, A> {
  public readonly tag = 'modify';
  public constructor(public readonly fun: (s: S1) => [S2, A]) {
    super();
  }
}

class Map<W, S1, S2, R, E, A, B> extends _XPure<W, S1, S2, R, E, B> {
  public readonly tag = 'map';

  public constructor(
    public readonly self: XPure<W, S1, S2, R, E, A>,
    public readonly fun: (a: A) => B,
  ) {
    super();
  }
}

class Fold<W, S1, S2, S3, R, R2, E1, E2, A, B> extends _XPure<
  W,
  S1,
  S3,
  R & R2,
  E2,
  B
> {
  public readonly tag = 'fold';
  public constructor(
    public readonly self: XPure<W, S1, S2, R, E1, A>,
    public readonly onFailure: (e: E1) => XPure<W, S1, S3, R2, E2, B>,
    public readonly onSuccess: (a: A) => XPure<W, S2, S3, R2, E2, B>,
  ) {
    super();
  }
}

class FlatMap<S1, R, A, W2, S22, S3, R2, E2, B> extends _XPure<
  W2,
  S1,
  S3,
  R & R2,
  E2,
  B
> {
  public readonly tag = 'flatMap';

  public constructor(
    public readonly self: XPure<W2, S1, S22, R, E2, A>,
    public readonly fun: (a: A) => XPure<W2, S22, S3, R2, E2, B>,
  ) {
    super();
  }
}

type View<W, S1, S2, R, E, A> =
  | Pure<A>
  | Fail<E>
  | Tell<W>
  | Ask<R>
  | Provide<W, S1, S2, R, E, A>
  | Modify<S1, S2, A>
  | Map<W, S1, S2, R, E, any, A>
  | Fold<W, S1, any, S2, R, any, any, E, any, A>
  | FlatMap<S1, R, any, W, any, S2, R, E, A>;

enum Cont {
  Map,
  FlatMap,
  Fold,
  Provide,
}

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface XPureF extends TyK {
  [$type]: XPure<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>,
    TyVar<this, 5>
  >;
}
