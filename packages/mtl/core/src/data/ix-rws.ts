// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, snd, tupled, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { MonadDefer, Monoid, Semigroup } from '@fp4ts/cats';
import { Seq } from '@fp4ts/collections';
import { Profunctor, Strong } from '@fp4ts/cats-profunctor';
import { MonadReader } from '../monad-reader';
import { MonadWriter } from '../monad-writer';
import { MonadState } from '../monad-state';

export type IxRWS<R, W, S1, S2, A> = _IxRWS<R, W, S1, S2, A>;

export const IxRWS = function <R, W, S1, S2, A>(
  runIxRWS: (r: R, s1: S1) => [A, S2, W],
): IxRWS<R, W, S1, S2, A> {
  return IxRWS.ask<R, S1>()
    .product(IxRWS.get())
    .flatMap(([r, s1]) => {
      const [a, s2, w] = runIxRWS(r, s1);
      return IxRWS.set<S2>(s2)
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

class _IxRWS<in R, out W, in S1, out S2, out A> {
  // -- Reader

  public provide(r: R): IxRWS<unknown, W, S1, S2, A> {
    return this.local(() => r);
  }

  public local<R0>(f: (r0: R0) => R): IxRWS<R0, W, S1, S2, A> {
    return new Local(this, f);
  }

  public ask<R2>(): IxRWS<R & R2, W, S1, S2, R2> {
    return this.flatMap(() => IxRWS.ask<R2, S2>());
  }

  // -- Writer

  public tell<W>(this: IxRWS<R, W, S1, S2, A>, w: W): IxRWS<R, W, S1, S2, A> {
    return this.flatMap(a => IxRWS.tell<W, S2>(w).map(() => a));
  }
  public log<W>(this: IxRWS<R, W, S1, S2, A>, w: W): IxRWS<R, W, S1, S2, A> {
    return this.tell(w);
  }

  public listen(): IxRWS<R, W, S1, S2, [A, W]> {
    return new Listen(this);
  }

  public written(): IxRWS<R, W, S1, S2, W> {
    return this.listen().map(snd);
  }

  public censor<W2>(f: (w: W) => W2, W: Semigroup<W2>): IxRWS<R, W2, S1, S2, A>;
  public censor<W2>(f: (w: W) => Seq<W2>): IxRWS<R, Seq<W2>, S1, S2, A>;
  public censor(f: any, W: any = Seq.Alternative.algebra()): any {
    return new Censor(this, f, W);
  }

  public reset<W>(
    this: IxRWS<R, W, S1, S2, A>,
    W: Monoid<W>,
  ): IxRWS<R, W, S1, S2, A>;
  public reset<W>(this: IxRWS<R, W, S1, S2, Seq<W>>): IxRWS<R, W, S1, S2, A>;
  public reset(W: any = Seq.Alternative.algebra()): any {
    return this.censor(() => W.empty, W);
  }

  // -- State

  public state<S3, B>(f: (s2: S2) => [B, S3]): IxRWS<R, W, S1, S3, B> {
    return this.flatMap(() => IxRWS.state(f));
  }

  public modify<S3>(f: (s2: S2) => S3): IxRWS<R, W, S1, S3, A> {
    return this.flatMap(a => IxRWS.state(s2 => [a, f(s2)]));
  }

  public contramap<S0>(f: (s0: S0) => S1): IxRWS<R, W, S0, S2, A> {
    return IxRWS.state((s0: S0) => [undefined, f(s0)]).productR(this);
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
    return IxRWS.state(([s1, c]: [S1, C]) => [c, s1]).flatMap(c =>
      this.modify(s2 => [s2, c]),
    );
  }

  public second<C>(): IxRWS<R, W, [C, S1], [C, S2], A> {
    return IxRWS.state(([c, s1]: [C, S1]) => [c, s1]).flatMap(c =>
      this.modify(s2 => [c, s2]),
    );
  }

  public get(): IxRWS<R, W, S1, S2, S2> {
    return this.productR(IxRWS.get<S2>());
  }

  public set<S2>(
    this: IxRWS<R, W, S1, S2, A>,
    s2: S2,
  ): IxRWS<R, W, S1, S2, void> {
    return this.productR(IxRWS.set<S2>(s2));
  }

  public bimap<S3, B>(
    f: (s2: S2) => S3,
    g: (a: A) => B,
  ): IxRWS<R, W, S1, S3, B> {
    return this.flatMap(a => IxRWS.state(s2 => [g(a), f(s2)]));
  }

  // -- Value

  public map<B>(f: (a: A) => B): IxRWS<R, W, S1, S2, B> {
    return new Map(this, f);
  }

  public map2<W, R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): <C>(f: (a: A, b: B) => C) => IxRWS<R & R2, W, S1, S3, C> {
    return f => this.flatMap(a => that.map(b => f(a, b)));
  }
  public product<R2, W, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, [A, B]> {
    return this.map2(that)(tupled);
  }
  public productL<R2, W, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, A> {
    return this.map2(that)((a, b) => a);
  }
  public productR<R2, W, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    that: IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, B> {
    return this.flatMap(() => that);
  }

  public flatMap<W, R2, S2, S3, B>(
    this: IxRWS<R, W, S1, S2, A>,
    f: (a: A) => IxRWS<R2, W, S2, S3, B>,
  ): IxRWS<R & R2, W, S1, S3, B> {
    return new FlatMap(this, f);
  }

  // -- Run

  public run(this: IxRWS<unknown, Seq<never>, unknown, unknown, A>): A {
    return this.runA(null, null);
  }

  public runState(
    this: IxRWS<unknown, Seq<never>, S1, S2, A>,
    s1: S1,
  ): [A, S2] {
    return this.runAS(null, s1);
  }
  public runStateA(this: IxRWS<unknown, Seq<never>, S1, S2, A>, s1: S1): A {
    return this.runAS(null, s1)[0];
  }
  public runStateS(this: IxRWS<unknown, Seq<never>, S1, S2, A>, s1: S1): S2 {
    return this.runAS(null, s1)[1];
  }

  public runReader(this: IxRWS<R, Seq<never>, unknown, unknown, A>, r: R): A {
    return this.runA(r, null);
  }

  public runWriter<W>(
    this: IxRWS<unknown, W, unknown, unknown, A>,
    W: Monoid<W>,
  ): [A, W];
  public runWriter<W>(
    this: IxRWS<unknown, Seq<W>, unknown, unknown, A>,
  ): [A, W];
  public runWriter(
    this: IxRWS<unknown, any, unknown, unknown, A>,
    W: Monoid<any> = Seq.Alternative.algebra(),
  ): [A, any] {
    return this.runAW(null, null, W);
  }

  public runWriterA<W>(
    this: IxRWS<unknown, W, unknown, unknown, A>,
    W: Monoid<W>,
  ): A;
  public runWriterA<W>(this: IxRWS<unknown, Seq<W>, unknown, unknown, A>): A;
  public runWriterA(
    this: IxRWS<unknown, any, unknown, unknown, A>,
    W: Monoid<any> = Seq.Alternative.algebra(),
  ): A {
    return this.runA(null, null, W);
  }

  public runWriterW<W>(
    this: IxRWS<unknown, W, unknown, unknown, A>,
    W: Monoid<W>,
  ): W;
  public runWriterW<W>(
    this: IxRWS<unknown, Seq<W>, unknown, unknown, A>,
  ): Seq<W>;
  public runWriterW(
    this: IxRWS<unknown, any, unknown, unknown, A>,
    W: Monoid<any> = Seq.Alternative.algebra(),
  ): any {
    return this.runW(null, null, W);
  }

  public runA<W2>(
    this: IxRWS<R, W2, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W2>,
  ): A;
  public runA<W2>(this: IxRWS<R, Seq<W2>, S1, S2, A>, r: R, s1: S1): A;
  public runA(r: R, s1: S1, W: any = Seq.Alternative.algebra()): A {
    return this.runAll(r, s1, W as any)[0];
  }

  public runS<W>(this: IxRWS<R, W, S1, S2, A>, r: R, s1: S1, W: Monoid<W>): S2;
  public runS<W>(this: IxRWS<R, Seq<W>, S1, S2, A>, r: R, s1: S1): S2;
  public runS(r: R, s1: S1, W: any = Seq.Alternative.algebra()): S2 {
    return this.runAll(r, s1, W as any)[1];
  }

  public runAS<W>(
    this: IxRWS<R, W, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W>,
  ): [A, S2];
  public runAS<W2>(this: IxRWS<R, Seq<W2>, S1, S2, A>, r: R, s1: S1): [A, S2];
  public runAS(r: R, s1: S1, W: any = Seq.Alternative.algebra()): [A, S2] {
    const [a, s2] = this.runAll(r, s1, W);
    return [a, s2];
  }

  public runW<W>(this: IxRWS<R, W, S1, S2, A>, r: R, s1: S1, W: Monoid<W>): W;
  public runW<W>(this: IxRWS<R, Seq<W>, S1, S2, A>, r: R, s1: S1): Seq<W>;
  public runW(r: R, s1: S1, W: any = Seq.Alternative.algebra()): any {
    return this.runAll(r, s1, W as any)[2];
  }

  public runAW<W>(
    this: IxRWS<R, W, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W>,
  ): [A, W];
  public runAW<W>(this: IxRWS<R, Seq<W>, S1, S2, A>, r: R, s1: S1): [A, Seq<W>];
  public runAW(r: R, s1: S1, W: any = Seq.Alternative.algebra()): [A, any] {
    const [a, , w] = this.runAll(r, s1, W);
    return [a, w];
  }

  public runSW<W>(
    this: IxRWS<R, W, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W>,
  ): [S2, W];
  public runSW<W>(
    this: IxRWS<R, Seq<W>, S1, S2, A>,
    r: R,
    s1: S1,
  ): [S2, Seq<W>];
  public runSW(r: R, s1: S1, W: any = Seq.Alternative.algebra()): [S2, any] {
    const [, s2, w] = this.runAll(r, s1, W);
    return [s2, w];
  }

  public runAll<W>(
    this: IxRWS<R, W, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W>,
  ): [A, S2, W];
  public runAll<W>(this: IxRWS<R, Seq<W>, S1, S2, A>, r: R, s1: S1): [A, S2, W];
  public runAll(
    r: R,
    s1: S1,
    W: any = Seq.Alternative.algebra(),
  ): [A, S2, any] {
    return this._runAll(r, s1, W as any);
  }

  private _runAll<W>(
    this: IxRWS<R, W, S1, S2, A>,
    r: R,
    s1: S1,
    W: Monoid<W>,
  ): [A, S2, W] {
    type AnyRWS = IxRWS<unknown, unknown, unknown, unknown, unknown>;
    type AnyView = View<unknown, unknown, unknown, unknown, unknown>;
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
      const cur = _cur as AnyView;
      let result: unknown;

      switch (cur.tag) {
        case 0: // Pure
          result = cur.value;
          break;

        case 1: // Ask
          result = env;
          break;

        case 2: // Tell
          log = M.combine_(log, cur.w);
          result = undefined;
          break;

        case 3: /* State */ {
          const as2 = cur._run(state);
          result = as2[0];
          state = as2[1];
          break;
        }

        case 4: /* Map */ {
          const self = cur.self as AnyView;
          const f = cur.f;

          switch (self.tag) {
            case 0: // Pure
              result = f(self.value);
              break;

            case 1: // Ask
              result = f(env);
              break;

            case 2: // Tell
              log = M.combine_(log, self.w);
              result = f(undefined);
              break;

            case 3: /* State */ {
              const as2 = self._run(state);
              result = f(as2[0]);
              state = as2[1];
              break;
            }

            default:
              stack.push(f);
              conts.push(Cont.MapK);
              _cur = cur.self;
              continue;
          }
          break;
        }

        case 5: /* FlatMap */ {
          const self = cur.self as AnyView;
          const f = cur.f;

          switch (self.tag) {
            case 0: // Pure
              _cur = f(self.value);
              continue;

            case 1: // Ask
              _cur = f(env);
              continue;

            case 2: // Tell
              log = M.combine_(log, self.w);
              _cur = f(undefined);
              continue;

            case 3: /* State */ {
              const as2 = self._run(state);
              _cur = f(as2[0]);
              state = as2[1];
              continue;
            }

            default:
              stack.push(f);
              conts.push(Cont.FlatMapK);
              _cur = self;
              continue;
          }
        }

        case 6: // Local
          conts.push(Cont.LocalK);
          envStack.push(env);
          env = cur.f(env);
          _cur = cur.self;
          continue;

        case 7: // Listen
          conts.push(Cont.ListenK);
          _cur = cur.self;
          continue;

        case 8: // Censor
          stack.push(cur.f);
          conts.push(Cont.CensorK);
          MStack.push(M);
          M = cur.W;
          _cur = cur.self;
          continue;
      }

      while (true) {
        if (conts.length <= 0) return [result as A, state as S2, log as W];
        const c = conts.pop()!;

        switch (c) {
          case 0: // MapK
            result = stack.pop()!(result);
            continue;

          case 1: /* FlatMapK */ {
            const next = stack.pop()! as (u: unknown) => AnyRWS;
            _cur = next(result);
            continue runLoop;
          }

          case 2: // LocalK
            env = envStack.pop();
            continue;

          case 3: // ListenK
            result = [result, log];
            continue;

          case 4: // CensorK
            M = MStack.pop()!;
            log = stack.pop()!(log);
            continue;
        }
      }
    }
  }
}

IxRWS.pure = <S, A>(a: A): IxRWS<unknown, never, S, S, A> => new Pure(a);
IxRWS.ask = <R, S>(): IxRWS<R, never, S, S, R> => new Ask();
IxRWS.tell = <W, S>(w: W): IxRWS<unknown, W, S, S, void> => new Tell(w);
IxRWS.state = <S1, S2, A>(
  f: (s1: S1) => [A, S2],
): IxRWS<unknown, never, S1, S2, A> => new State<S1, S2, A>(f);
IxRWS.modify = <S1, S2>(
  f: (s1: S1) => S2,
): IxRWS<unknown, never, S1, S2, void> => IxRWS.state(s => [undefined, f(s)]);
IxRWS.get = <S>(): IxRWS<unknown, never, S, S, S> => IxRWS.state(s => [s, s]);
IxRWS.set = <S>(s: S): IxRWS<unknown, never, unknown, S, void> =>
  IxRWS.state(() => [undefined, s]);

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
RWS.modify = IxRWS.modify as <S>(
  f: (s1: S) => S,
) => RWS<unknown, never, S, void>;
RWS.state = IxRWS.state as <S, A>(
  f: (s: S) => [A, S],
) => RWS<unknown, never, S, A>;
RWS.get = IxRWS.get;
RWS.set = IxRWS.set as <S>(s: S) => RWS<unknown, never, S, void>;

RWS.Monad = <R, W, S>(): MonadDefer<$<IxRWSF, [R, W, S, S]>> =>
  MonadDefer.of({
    pure: <A>(a: A) => IxRWS.pure<S, A>(a),
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
  });

RWS.MonadReader = <R, W, S>(): MonadReader<$<IxRWSF, [R, W, S, S]>, R> =>
  MonadReader.of({
    ...RWS.Monad<R, W, S>(),
    ask: () => IxRWS.ask<R, S>(),
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
    get: IxRWS.get<S>(),
    set: s => IxRWS.set(s),
    modify: f => IxRWS.state(s => [undefined, f(s)]),
    inspect: f => IxRWS.state(s => [f(s), s]),
  });

class Pure<A> extends _IxRWS<unknown, never, unknown, never, A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }
}

class Ask<R> extends _IxRWS<R, never, unknown, never, R> {
  public readonly tag = 1;
  public constructor() {
    super();
  }
}

class Tell<W> extends _IxRWS<unknown, W, unknown, never, void> {
  public readonly tag = 2;
  public constructor(public readonly w: W) {
    super();
  }
}

class State<S1, S2, A> extends _IxRWS<unknown, never, S1, S2, A> {
  public readonly tag = 3;
  public constructor(public readonly _run: (s1: S1) => [A, S2]) {
    super();
  }
}

class Map<R, W, S1, S2, A, B> extends _IxRWS<R, W, S1, S2, B> {
  public readonly tag = 4;
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
  public readonly tag = 5;
  public constructor(
    public readonly self: IxRWS<R1, W, S1, S2, A>,
    public readonly f: (a: A) => IxRWS<R2, W, S2, S3, B>,
  ) {
    super();
  }
}

class Local<R0, R, W, S1, S2, A> extends _IxRWS<R0, W, S1, S2, A> {
  public readonly tag = 6;
  public constructor(
    public readonly self: IxRWS<R, W, S1, S2, A>,
    public readonly f: (r0: R0) => R,
  ) {
    super();
  }
}

class Listen<R, W, S1, S2, A> extends _IxRWS<R, W, S1, S2, [A, W]> {
  public readonly tag = 7;
  public constructor(public readonly self: IxRWS<R, W, S1, S2, A>) {
    super();
  }
}

class Censor<R, W, W2, S1, S2, A> extends _IxRWS<R, W2, S1, S2, A> {
  public readonly tag = 8;
  public constructor(
    public readonly self: IxRWS<R, W, S1, S2, A>,
    public readonly f: (w: W) => W2,
    public readonly W: Semigroup<W2>,
  ) {
    super();
  }
}

enum Cont {
  MapK = 0,
  FlatMapK = 1,
  LocalK = 2,
  ListenK = 3,
  CensorK = 4,
}

type View<R, W, S1, S2, A> =
  | Pure<A>
  | Ask<R>
  | Local<R, any, W, S1, S2, A>
  | Listen<R, W, S1, S2, A>
  | Tell<W>
  | Censor<R, any, W, S1, S2, A>
  | State<S1, S2, A>
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
