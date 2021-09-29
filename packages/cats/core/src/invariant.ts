import { AnyK, Base, instance, Kind } from '@cats4ts/core';

export interface Invariant<F extends AnyK> extends Base<F> {
  readonly imap: <A, B>(
    f: (a: A) => B,
    g: (b: B) => A,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;

  readonly imap_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => A,
  ) => Kind<F, [B]>;
}

export type InvariantRequirements<F extends AnyK> = Pick<
  Invariant<F>,
  'imap_'
> &
  Partial<Invariant<F>>;

export const Invariant = Object.freeze({
  of: <F extends AnyK>(F: InvariantRequirements<F>): Invariant<F> =>
    instance<Invariant<F>>({
      imap: (f, g) => fa => F.imap_(fa, f, g),
      ...F,
    }),
});
