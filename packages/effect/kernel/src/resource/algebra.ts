import { Kind } from '@cats4ts/core';
import { Poll } from '../poll';
import { ExitCase } from './exit-case';

export abstract class Resource<F, A> {}

export class Allocate<F, A> extends Resource<F, A> {
  public readonly tag = 'allocate';
  public constructor(
    public readonly resource: (
      p: Poll<F>,
    ) => Kind<F, [[A, (ec: ExitCase) => Kind<F, [void]>]]>,
  ) {
    super();
  }
}

export class Pure<F, A> extends Resource<F, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class FlatMap<F, E, A> extends Resource<F, A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: Resource<F, E>,
    public readonly f: (e: E) => Resource<F, A>,
  ) {
    super();
  }
}

export class Eval<F, A> extends Resource<F, A> {
  public readonly tag = 'eval';
  public constructor(public readonly fa: Kind<F, [A]>) {
    super();
  }
}

export type View<F, A> =
  | Allocate<F, A>
  | Pure<F, A>
  | FlatMap<F, any, A>
  | Eval<F, A>;

export const view = <F, A>(_: Resource<F, A>): View<F, A> => _ as any;
