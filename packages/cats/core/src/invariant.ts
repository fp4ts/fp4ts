import { Base, instance, Kind } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Invariant<F> extends Base<F> {
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

export type InvariantRequirements<F> = Pick<Invariant<F>, 'imap_'> &
  Partial<Invariant<F>>;

export const Invariant = Object.freeze({
  of: <F>(F: InvariantRequirements<F>): Invariant<F> =>
    instance<Invariant<F>>({
      imap: (f, g) => fa => F.imap_(fa, f, g),
      ...F,
    }),
});
