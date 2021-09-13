import { Kind, URIS } from '../../core';

export abstract class Free<F extends URIS, C, S, R, E, A> {}

export class Pure<F extends URIS, C, S, R, E, A> extends Free<
  F,
  C,
  S,
  R,
  E,
  A
> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Suspend<F extends URIS, C, S, R, E, A> extends Free<
  F,
  C,
  S,
  R,
  E,
  A
> {
  public readonly tag = 'suspend';
  public constructor(public readonly fa: Kind<F, C, S, R, E, A>) {
    super();
  }
}

export class FlatMap<F extends URIS, C, S, R, E, A, B> extends Free<
  F,
  C,
  S,
  R,
  E,
  B
> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: Free<F, C, S, R, E, A>,
    public readonly f: (a: A) => Free<F, C, S, R, E, B>,
  ) {
    super();
  }
}

export type View<F extends URIS, C, S, R, E, A> =
  | Pure<F, C, S, R, E, A>
  | Suspend<F, C, S, R, E, A>
  | FlatMap<F, C, S, R, E, unknown, A>;

export const view = <F extends URIS, C, S, R, E, A>(
  _: Free<F, C, S, R, E, A>,
): View<F, C, S, R, E, A> => _ as any;
