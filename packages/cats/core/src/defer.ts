import { Base, Kind, instance } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Defer<F> extends Base<F> {
  readonly defer: <A>(fa: () => Kind<F, [A]>) => Kind<F, [A]>;

  readonly fix: <A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>) => Kind<F, [A]>;
}

export type DeferRequirements<F> = Pick<Defer<F>, 'defer'> & Partial<Defer<F>>;
export const Defer = Object.freeze({
  of: <F>(F: DeferRequirements<F>): Defer<F> =>
    instance<Defer<F>>({
      fix: <A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>): Kind<F, [A]> => {
        const res: Kind<F, [A]> = F.defer(() => f(res));
        return res;
      },

      ...F,
    }),
});
