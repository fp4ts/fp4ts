import { Kind } from '@cats4ts/core';

export abstract class Free<F, A> {
  private readonly __void!: void;
}

export class Pure<F, A> extends Free<F, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Suspend<F, A> extends Free<F, A> {
  public readonly tag = 'suspend';
  public constructor(public readonly fa: Kind<F, [A]>) {
    super();
  }
}

export class FlatMap<F, A, B> extends Free<F, B> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: Free<F, A>,
    public readonly f: (a: A) => Free<F, B>,
  ) {
    super();
  }
}

export type View<F, A> = Pure<F, A> | Suspend<F, A> | FlatMap<F, unknown, A>;

export const view = <F, A>(_: Free<F, A>): View<F, A> => _ as any;
