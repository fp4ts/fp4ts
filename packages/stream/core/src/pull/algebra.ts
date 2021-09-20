import { AnyK, Kind } from '@cats4ts/core';
import { FunctionK } from '@cats4ts/cats-core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { Chunk } from '../chunk/algebra';

export abstract class Pull<F extends AnyK, O, R> {
  readonly __void!: void;
}

export class Succeed<F extends AnyK, R> extends Pull<F, never, R> {
  public readonly tag = 'succeed';
  public constructor(public readonly result: R) {
    super();
  }
}

export class Fail<F extends AnyK> extends Pull<F, never, never> {
  public readonly tag = 'fail';
  public constructor(public readonly e: Error) {
    super();
  }
}

export type Terminal<F extends AnyK, R> = Succeed<F, R> | Fail<F>;

export class Output<F extends AnyK, O> extends Pull<F, O, void> {
  public readonly tag = 'output';
  public constructor(public readonly values: Chunk<O>) {
    super();
  }
}

export class Translate<F extends AnyK, G extends AnyK, O> extends Pull<
  G,
  O,
  void
> {
  public readonly tag = 'translate';
  public constructor(
    public readonly self: Pull<F, O, void>,
    public readonly nt: FunctionK<F, G>,
  ) {
    super();
  }
}

export class FlatMapOutput<F extends AnyK, O, P> extends Pull<F, P, void> {
  public readonly tag = 'flatMapOutput';
  public constructor(
    public readonly self: Pull<F, O, void>,
    public readonly fun: (o: O) => Pull<F, P, void>,
  ) {
    super();
  }
}

export class Uncons<F extends AnyK, O> extends Pull<
  F,
  never,
  Option<[Chunk<O>, Pull<F, O, void>]>
> {
  public readonly tag = 'uncons';
  public constructor(public readonly self: Pull<F, O, void>) {
    super();
  }
}

export class Eval<F extends AnyK, R> extends Pull<F, never, R> {
  public readonly tag = 'eval';
  public constructor(public readonly value: Kind<F, [R]>) {
    super();
  }
}

export type AlgEffect<F extends AnyK, R> = Eval<F, R>;

export type Action<F extends AnyK, O, R> =
  | Output<F, O>
  | Translate<F, any, O>
  | FlatMapOutput<F, any, O>
  | AlgEffect<F, R>
  | Uncons<F, O>;

export class Bind<F extends AnyK, O, X, R> extends Pull<F, O, R> {
  public readonly tag = 'bind';
  public constructor(
    public readonly step: Pull<F, O, X>,
    public readonly cont: (r: Terminal<F, X>) => Pull<F, O, R>,
  ) {
    super();
  }
}

export type View<F extends AnyK, O, R> =
  | Terminal<F, R>
  | Action<F, O, R>
  | Bind<F, O, any, R>;

export const view = <F extends AnyK, O, R>(_: Pull<F, O, R>): View<F, O, R> =>
  _ as any;
