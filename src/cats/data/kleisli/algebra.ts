import { AnyK, Kind } from '../../../core';
import { FlatMap } from '../../flat-map';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';

export abstract class Kleisli<F extends AnyK, A, B> {
  private readonly __void!: void;
}

export class Identity<F extends AnyK, A> extends Kleisli<F, A, A> {
  public readonly tag = 'identity';
  public constructor(public readonly F: Applicative<F>) {
    super();
  }
}

export class Pure<F extends AnyK, B> extends Kleisli<F, unknown, B> {
  public readonly tag = 'pure';
  public constructor(
    public readonly F: Applicative<F>,
    public readonly value: B,
  ) {
    super();
  }
}

export class Suspend<F extends AnyK, A, B> extends Kleisli<F, A, B> {
  public readonly tag = 'suspend';
  public constructor(public readonly f: (a: A) => Kind<F, [B]>) {
    super();
  }
}

export class Map<F extends AnyK, A, B, C> extends Kleisli<F, A, C> {
  public readonly tag = 'map';
  public constructor(
    public readonly F: Functor<F>,
    public readonly self: Kleisli<F, A, B>,
    public readonly f: (b: B) => C,
  ) {
    super();
  }
}

export class FlatMapK<F extends AnyK, A1, A2, B, C> extends Kleisli<
  F,
  A1 & A2,
  C
> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly F: FlatMap<F>,
    public readonly self: Kleisli<F, A1, B>,
    public readonly f: (x: B) => Kleisli<F, A2, C>,
  ) {
    super();
  }
}

export class Adapt<F extends AnyK, A, AA, B> extends Kleisli<F, AA, B> {
  public readonly tag = 'adapt';
  public constructor(
    public readonly self: Kleisli<F, A, B>,
    public readonly f: (a: AA) => A,
  ) {
    super();
  }
}

export class AdaptF<F extends AnyK, A, AA, B> extends Kleisli<F, AA, B> {
  public readonly tag = 'adaptF';
  public constructor(
    public readonly F: FlatMap<F>,
    public readonly self: Kleisli<F, A, B>,
    public readonly f: (a: AA) => Kind<F, [A]>,
  ) {
    super();
  }
}

export type View<F extends AnyK, A, B> =
  | Identity<F, A>
  | Pure<F, B>
  | Suspend<F, A, B>
  | Map<F, A, any, B>
  | FlatMapK<F, any, A, any, B>
  | Adapt<F, A, any, B>
  | AdaptF<F, A, any, B>;

export const view = <F extends AnyK, A, B>(
  _: Kleisli<F, A, B>,
): View<F, A, B> => _ as any;
