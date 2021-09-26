import { Base, Kind, AnyK, instance } from '@cats4ts/core';

export interface Defer<F extends AnyK> extends Base<F> {
  readonly defer: <A>(fa: () => Kind<F, [A]>) => Kind<F, [A]>;

  readonly fix: <A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>) => Kind<F, [A]>;
}

export type DeferRequirements<F extends AnyK> = Pick<Defer<F>, 'defer'> &
  Partial<Defer<F>>;
export const Defer = Object.freeze({
  of: <F extends AnyK>(F: DeferRequirements<F>): Defer<F> =>
    instance<Defer<F>>({
      fix: <A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>): Kind<F, [A]> => {
        const res: Kind<F, [A]> = F.defer(() => f(res));
        return res;
      },

      ...F,
    }),
});
