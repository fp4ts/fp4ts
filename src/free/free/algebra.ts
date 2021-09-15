import { AnyK, Kind } from '../../core';

export abstract class Free<F extends AnyK, A> {}

export class Pure<F extends AnyK, A> extends Free<F, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Suspend<F extends AnyK, A> extends Free<F, A> {
  public readonly tag = 'suspend';
  public constructor(public readonly fa: Kind<F, [A]>) {
    super();
  }
}

export class FlatMap<F extends AnyK, A, B> extends Free<F, B> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: Free<F, A>,
    public readonly f: (a: A) => Free<F, B>,
  ) {
    super();
  }
}

export type View<F extends AnyK, A> =
  | Pure<F, A>
  | Suspend<F, A>
  | FlatMap<F, unknown, A>;

export const view = <F extends AnyK, A>(_: Free<F, A>): View<F, A> => _ as any;
