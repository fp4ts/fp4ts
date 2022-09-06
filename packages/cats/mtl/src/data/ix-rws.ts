// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, snd, tupled, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { Profunctor, StackSafeMonad, Strong } from '@fp4ts/cats-core';
import { Chain } from '@fp4ts/cats-core/lib/data';
import { MonadReader } from '../monad-reader';
import { MonadWriter } from '../monad-writer';
import { MonadState } from '../monad-state';

export type IxRWS<R, W, S1, S2, A> = _IxRWS<R, W, S1, S2, A>;

export const IxRWS = function <R, W, S1, S2, A>(
  runIxRWS: (r: R, s1: S1) => [A, S2, W],
): IxRWS<R, W, S1, S2, A> {
  return IxRWS.ask<R, W, S1>()
    .product(IxRWS.get())
    .flatMap(([r, s1]) => {
      const [a, s2, w] = runIxRWS(r, s1);
      return IxRWS.set<W, S2>(s2)
        .productL(IxRWS.tell(w))
        .map(() => a);
    });
};

export type RWS<R, W, S, A> = IxRWS<R, W, S, S, A>;

export const RWS = function <R, W, S, A>(
  runRWS: (r: R, s1: S) => [A, S, W],
): RWS<R, W, S, A> {
  return IxRWS(runRWS);
};

class _IxRWS<in R, in out W, in S1, out S2, out A> {
  // -- Reader

  public provide(r: R): IxRWS<unknown, W, S1, S2, A> {
    return this.local(() => r);
  }

  public local<R0>(f: (r0: R0) => R): IxRWS<R0, W, S1, S2, A> {
    return new Local(this, f);
  }

  public ask<R2>(): IxRWS<R & R2, W, S1, S2, R2> {
    return this.flatMap(() => IxRWS.ask<R2, W, S2>());
  }

  // -- Writer

  public tell(w: W): IxRWS<R, W, S1, S2, A> {
    return this.flatMap(a => IxRWS.tell<W, S2>(w).map(() => a));
  }
  public log(w: W): IxRWS<R, W, S1, S2, A> {
    return this.tell(w);
  }

  public listen(): IxRWS<R, W, S1, S2, [A, W]> {
    return new Listen(this);
  }

  public written(): IxRWS<R, W, S1, S2, W> {
    return this.listen().map(snd);
  }

  public censor<W2>(f: (w: W) => W2, W: Semigroup<W2>): IxRWS<R, W2, S1, S2, A>;
  public censor<W2>(f: (w: W) => Chain<W2>): IxRWS<R, Chain<W2>, S1, S2, A>;
  public censor(f: any, W: any = Chain.MonoidK.algebra()): any {
    return new Censor(this, f, W);
  }

  public reset(W: Monoid<W>): IxRWS<R, W, S1, S2, A>;
  public reset<W>(this: IxRWS<R, W, S1, S2, Chain<W>>): IxRWS<R, W, S1, S2, A>;
  public reset(W: any = Chain.MonoidK.algebra()): any {
    return this.censor(() => W.empty, W);
  }

  // -- State

  public state<S3, B>(f: (s2: S2) => [B, S3]): IxRWS<R, W, S1, S3, B> {
    return this.flatMap(() => IxRWS.state<W>()(f));
  }

  public modify<S3>(f: (s2: S2) => S3): IxRWS<R, W, S1, S3, A> {
    return this.flatMap(a => IxRWS.state<W>()(s2 => [a, f(s2)]));
  }

  public contramap<S0>(f: (s0: S0) => S1): IxRWS<R, W, S0, S2, A> {
    return IxRWS.state<W>()((s0: S0) => [undefined, f(s0)]).productR(this);
  }

  public provideState(s1: S1): IxRWS<R, W, unknown, S2, A> {
    return this.contramap(() => s1);
  }

  public dimap<S0, S3>(
    f: (s0: S0) => S1,
    g: (s2: S2) => S3,
  ): IxRWS<R, W, S0, S3, A> {
    return this.contramap(f).modify(g);
  }

  public first<C>(): IxRWS<R, W, [S1, C], [S2, C], A> {
    return IxRWS.state<W>()(([s1, c]: [S1, C]) => [c, s1]).flatMap(c =>
      this.modify(s2 => [s2, c]),
    );
  }

  public second<C>(): IxRWS<R, W, [C, S1], [C, S2], A> {
    return IxRWS.state<W>()(([c, s1]: [C, S1]) => [c, s1]).flatMap(c =>
      this.modify(s2 => [c, s2]),
    );
  }

  public get(): IxRWS<R, W, S1, S2, S2> {
    return this.productR(IxRWS.get<W, S2>());
  }

  public set<S2>(
    this: IxRWS<R, W, S1, S2, A>,
    s2: S2,
  ): IxRWS<R, W, S1, S2, void> {
    return this.productR(IxRWS.set<W, S2>(s2));
  }

  public bimap<S3, B>(
    f: (s2: S2) => S3,
    g: (a: A) => B,
  ): IxRWS<R, W, S1, S3, B> {
    return this.flatMap(a => IxRWS.state<W>()(s2 => [g(a), f(s2)]));
  }

  // -- Value

  public map<B>(f: (a: A) => B): IxRWS<R, W, S1, S2, B> {
    return new Map(this, f);
  }

  public map2<R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): <C>(f: (a: A, b: B) => C) => IxRWS<R & R2, W, S1, S3, C> {
    return f => this.flatMap(a => that.map(b => f(a, b)));
  }
  public product<R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, [A, B]> {
    return this.map2(that)(tupled);
  }
  public productL<R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, A> {
    return this.map2(that)((a, b) => a);
  }
  public productR<R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, B> {
    return this.flatMap(() => that);
  }

  public flatMap<R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    f: (a: A) => IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, B> {
    return new FlatMap(this, f);
  }

  // -- Run

  public runA<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): A;
  public runA<W2>(this: IxRWS<R, Chain<W2>, S1, S2, A>, r: R, s1: S1): A;
  public runA(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): A {
    return this.runAll(r, s1, W as any)[0];
  }

  public runS<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): S2;
  public runS<W2>(this: IxRWS<R, Chain<W2>, S1, S2, A>, r: R, s1: S1): S2;
  public runS(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): S2 {
    return this.runAll(r, s1, W as any)[1];
  }

  public runAS<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): [A, S2];
  public runAS<W2>(this: IxRWS<R, Chain<W2>, S1, S2, A>, r: R, s1: S1): [A, S2];
  public runAS(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): [A, S2] {
    const [a, s2] = this.runAll(r, s1, W);
    return [a, s2];
  }

  public runW<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): W2;
  public runW<W2>(
    this: IxRWS<R, Chain<W2>, S1, S2, A>,
    r: R,
    s1: S1,
  ): Chain<W2>;
  public runW(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): any {
    return this.runAll(r, s1, W as any)[2];
  }

  public runAW<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): [A, W];
  public runAW<W2>(
    this: IxRWS<R, Chain<W2>, S1, S2, A>,
    r: R,
    s1: S1,
  ): [A, Chain<W2>];
  public runAW(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): [A, any] {
    const [a, , w] = this.runAll(r, s1, W);
    return [a, w];
  }

  public runSW<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): [S2, W];
  public runSW<W2>(
    this: IxRWS<R, Chain<W2>, S1, S2, A>,
    r: R,
    s1: S1,
  ): [S2, Chain<W2>];
  public runSW(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): [S2, any] {
    const [, s2, w] = this.runAll(r, s1, W);
    return [s2, w];
  }

  public runAll<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): [A, S2, W2];
  public runAll<W2>(
    this: IxRWS<R, Chain<W2>, S1, S2, A>,
    r: R,
    s1: S1,
  ): [A, S2, W2];
  public runAll(r: R, s1: S1, W: any = Chain.MonoidK.algebra()): [A, S2, any] {
    return this._runAll(r, s1, W as any);
  }

  private _runAll<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): [A, S2, W2] {
    type AnyRWS = IxRWS<unknown, unknown, unknown, unknown, unknown>;
    type Frame = (a: unknown) => unknown;

    let _cur: AnyRWS = this as AnyRWS;
    let env: unknown = r;
    const envStack: unknown[] = [];
    let state: unknown = s1;
    let M: Semigroup<unknown> = W as Monoid<unknown>;
    const MStack: Semigroup<unknown>[] = [];
    let log: unknown = W.empty;
    const stack: Frame[] = [];
    const conts: Cont[] = [];

    runLoop: while (true) {
      const cur = _cur as View<unknown, unknown, unknown, unknown, unknown>;
      let result: unknown;

      switch (cur.tag) {
        case 0: // Pure
          result = cur.value;
          break;

        case 1: // Ask
          result = env;
          break;

        case 2: // Local
          conts.push(Cont.LocalK);
          envStack.push(env);
          env = cur.f(env);
          _cur = cur.self;
          continue;

        case 3: // Listen
          conts.push(Cont.ListenK);
          _cur = cur.self;
          continue;

        case 4: // Tell
          log = M.combine_(log, () => cur.w);
          result = undefined;
          break;

        case 5: // Censor
          stack.push(cur.f);
          conts.push(Cont.CensorK);
          MStack.push(M);
          M = cur.W;
          _cur = cur.self;
          continue;

        case 6: /* State */ {
          const as2 = cur.run(state);
          result = as2[0];
          state = as2[1];
          break;
        }

        case 7: // Map
          stack.push(cur.f);
          conts.push(Cont.MapK);
          _cur = cur.self;
          continue;

        case 8: // FlatMap
          stack.push(cur.f);
          conts.push(Cont.FlatMapK);
          _cur = cur.self;
          continue;
      }

      while (true) {
        if (conts.length <= 0) return [result as A, state as S2, log as W2];
        const c = conts.pop()!;

        switch (c) {
          case 0: // LocalK
            env = envStack.pop();
            continue;

          case 1: // ListenK
            result = [result, log];
            continue;

          case 2: // CensorK
            M = MStack.pop()!;
            log = stack.pop()!(log);
            continue;

          case 3: // MapK
            result = stack.pop()!(result);
            continue;

          case 4: /* FlatMapK */ {
            const next = stack.pop()! as (u: unknown) => AnyRWS;
            _cur = next(result);
            continue runLoop;
          }
        }
      }
    }
  }
}

IxRWS.pure = <W, S, A>(a: A): IxRWS<unknown, W, S, S, A> => new Pure(a);
IxRWS.ask = <R, W, S>(): IxRWS<R, W, S, S, R> => new Ask();
IxRWS.tell = <W, S>(w: W): IxRWS<unknown, W, S, S, void> => new Tell(w);
IxRWS.state =
  <W>() =>
  <S1, S2, A>(f: (s1: S1) => [A, S2]): IxRWS<unknown, W, S1, S2, A> =>
    new State<W, S1, S2, A>(f);
IxRWS.modify =
  <W>() =>
  <S1, S2>(f: (s1: S1) => S2): IxRWS<unknown, W, S1, S2, void> =>
    IxRWS.state<W>()(s => [undefined, f(s)]);
IxRWS.get = <W, S>(): IxRWS<unknown, W, S, S, S> =>
  IxRWS.state<W>()(s => [s, s]);
IxRWS.set = <W, S>(s: S): IxRWS<unknown, W, unknown, S, void> =>
  IxRWS.state<W>()(() => [undefined, s]);

IxRWS.Profunctor = <R, W, A>(): Profunctor<
  λ<IxRWSF, [Fix<R>, Fix<W>, α, β, Fix<A>]>
> => Profunctor.of({ dimap_: (fa, f, g) => fa.dimap(f, g) });
IxRWS.Strong = <R, W, A>(): Strong<λ<IxRWSF, [Fix<R>, Fix<W>, α, β, Fix<A>]>> =>
  Strong.of({
    ...IxRWS.Profunctor(),
    first:
      <C>() =>
      fa =>
        fa.first<C>(),
    second:
      <C>() =>
      fa =>
        fa.second<C>(),
  });

RWS.pure = IxRWS.pure;
RWS.ask = IxRWS.ask;
RWS.tell = IxRWS.tell;
RWS.modify = IxRWS.modify as <W>() => <S>(
  f: (s1: S) => S,
) => RWS<unknown, W, S, void>;
RWS.state = IxRWS.state as <W>() => <S, A>(
  f: (s: S) => [A, S],
) => RWS<unknown, W, S, A>;
RWS.get = IxRWS.get;
RWS.set = IxRWS.set as <W, S>(s: S) => RWS<unknown, W, S, void>;

RWS.Monad = <R, W, S>(): StackSafeMonad<$<IxRWSF, [R, W, S, S]>> =>
  StackSafeMonad.of({
    pure: <A>(a: A) => IxRWS.pure<W, S, A>(a),
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
  });

RWS.MonadReader = <R, W, S>(): MonadReader<$<IxRWSF, [R, W, S, S]>, R> =>
  MonadReader.of({
    ...RWS.Monad<R, W, S>(),
    ask: () => IxRWS.ask<R, W, S>(),
    local_: (fa, f) => fa.local(f),
  });

RWS.MonadWriter = <R, W, S>(
  W: Monoid<W>,
): MonadWriter<$<IxRWSF, [R, W, S, S]>, W> =>
  MonadWriter.of({
    ...RWS.Monad<R, W, S>(),
    monoid: W,
    censor_: (fa, f) => fa.censor(f, W),
    listen: fa => fa.listen(),
    tell: w => IxRWS.tell<W, S>(w),
  });

RWS.MonadState = <R, W, S>(): MonadState<$<IxRWSF, [R, W, S, S]>, S> =>
  MonadState.of({
    ...RWS.Monad<R, W, S>(),
    get: IxRWS.get<W, S>(),
    set: s => IxRWS.set(s),
    modify: f => IxRWS.state<W>()(s => [undefined, f(s)]),
    inspect: f => IxRWS.state<W>()(s => [f(s), s]),
  });

class Pure<W, A> extends _IxRWS<unknown, W, unknown, never, A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }
}

class Ask<R, W> extends _IxRWS<R, W, unknown, never, R> {
  public readonly tag = 1;
  public constructor() {
    super();
  }
}

class Local<R0, R, W, S1, S2, A> extends _IxRWS<R0, W, S1, S2, A> {
  public readonly tag = 2;
  public constructor(
    public readonly self: IxRWS<R, W, S1, S2, A>,
    public readonly f: (r0: R0) => R,
  ) {
    super();
  }
}

class Listen<R, W, S1, S2, A> extends _IxRWS<R, W, S1, S2, [A, W]> {
  public readonly tag = 3;
  public constructor(public readonly self: IxRWS<R, W, S1, S2, A>) {
    super();
  }
}
class Tell<W> extends _IxRWS<unknown, W, unknown, never, void> {
  public readonly tag = 4;
  public constructor(public readonly w: W) {
    super();
  }
}
class Censor<R, W, W2, S1, S2, A> extends _IxRWS<R, W2, S1, S2, A> {
  public readonly tag = 5;
  public constructor(
    public readonly self: IxRWS<R, W, S1, S2, A>,
    public readonly f: (w: W) => W2,
    public readonly W: Semigroup<W>,
  ) {
    super();
  }
}

class State<W, S1, S2, A> extends _IxRWS<unknown, W, S1, S2, A> {
  public readonly tag = 6;
  public constructor(public readonly run: (s1: S1) => [A, S2]) {
    super();
  }
}

class Map<R, W, S1, S2, A, B> extends _IxRWS<R, W, S1, S2, B> {
  public readonly tag = 7;
  public constructor(
    public readonly self: IxRWS<R, W, S1, S2, A>,
    public readonly f: (a: A) => B,
  ) {
    super();
  }
}

class FlatMap<R1, R2, W, S1, S2, S3, A, B> extends _IxRWS<
  R1 & R2,
  W,
  S1,
  S3,
  B
> {
  public readonly tag = 8;
  public constructor(
    public readonly self: IxRWS<R1, W, S1, S2, A>,
    public readonly f: (a: A) => IxRWS<R2, W, S2, S3, B>,
  ) {
    super();
  }
}

enum Cont {
  LocalK = 0,
  ListenK = 1,
  CensorK = 2,
  MapK = 3,
  FlatMapK = 4,
}

type View<R, W, S1, S2, A> =
  | Pure<W, A>
  | Ask<R, W>
  | Local<R, any, W, S1, S2, A>
  | Listen<R, W, S1, S2, A>
  | Tell<W>
  | Censor<R, any, W, S1, S2, A>
  | State<W, S1, S2, A>
  | Map<R, W, S1, S2, any, A>
  | FlatMap<R, any, W, S1, any, S2, any, A>;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IxRWSF
  extends TyK<[unknown, unknown, unknown, unknown, unknown]> {
  [$type]: IxRWS<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>
  >;
}
