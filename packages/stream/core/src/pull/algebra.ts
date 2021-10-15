import { Kind } from '@cats4ts/core';
import { FunctionK, Option } from '@cats4ts/cats';

import { Chunk } from '../chunk/algebra';

export abstract class Pull<F, O, R> {
  readonly __void!: void;
}

export class Succeed<R> extends Pull<unknown, never, R> {
  public readonly tag = 'succeed';
  public constructor(public readonly result: R) {
    super();
  }
}

export class Fail extends Pull<unknown, never, never> {
  public readonly tag = 'fail';
  public constructor(public readonly error: Error) {
    super();
  }
}

export type Terminal<R> = Succeed<R> | Fail;

export class Output<F, O> extends Pull<F, O, void> {
  public readonly tag = 'output';
  public constructor(public readonly values: Chunk<O>) {
    super();
  }
}

export class Translate<G, F, O> extends Pull<F, O, void> {
  public readonly tag = 'translate';
  public constructor(
    public readonly self: Pull<G, O, void>,
    public readonly nt: FunctionK<G, F>,
  ) {
    super();
  }
}

export class FlatMapOutput<F, O, P> extends Pull<F, P, void> {
  public readonly tag = 'flatMapOutput';
  public constructor(
    public readonly self: Pull<F, O, void>,
    public readonly fun: (o: O) => Pull<F, P, void>,
  ) {
    super();
  }
}

export class Uncons<F, O> extends Pull<
  F,
  never,
  Option<[Chunk<O>, Pull<F, O, void>]>
> {
  public readonly tag = 'uncons';
  public constructor(public readonly self: Pull<F, O, void>) {
    super();
  }
}

export class Eval<F, R> extends Pull<F, never, R> {
  public readonly tag = 'eval';
  public constructor(public readonly value: Kind<F, [R]>) {
    super();
  }
}

export type AlgEffect<F, R> = Eval<F, R>;

export type Action<F, O, R> =
  | Output<F, O>
  | Translate<any, F, O>
  | FlatMapOutput<F, any, O>
  | AlgEffect<F, R>
  | Uncons<F, O>;

export class Bind<F, O, X, R> extends Pull<F, O, R> {
  public readonly tag = 'bind';
  public constructor(
    public readonly step: Pull<F, O, X>,
    public readonly cont: (r: Terminal<X>) => Pull<F, O, R>,
  ) {
    super();
  }
}

export type View<F, O, R> = Terminal<R> | Action<F, O, R> | Bind<F, O, any, R>;

export const view = <F, O, R>(_: Pull<F, O, R>): View<F, O, R> => _ as any;
