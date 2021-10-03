import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';

import { Outcome } from './algebra';
import { fold_ } from './operators';

export const outcomeEq = <F extends AnyK, E, A>(
  EqE: Eq<E>,
  EqFA: Eq<Kind<F, [A]>>,
): Eq<Outcome<F, E, A>> =>
  Eq.of({
    equals: (lhs, rhs) => {
      if (lhs === rhs) return true;
      return fold_(
        lhs,
        () =>
          fold_(
            rhs,
            () => true,
            () => false,
            () => false,
          ),
        el =>
          fold_(
            rhs,
            () => false,
            er => EqE.equals(el, er),
            () => false,
          ),
        fal =>
          fold_(
            rhs,
            () => false,
            () => false,
            far => EqFA.equals(fal, far),
          ),
      );
    },
  });
