import { Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { Clock } from '@cats4ts/effect-kernel';
import { IsEq, RuleSet } from '@cats4ts/cats-test-kit';
import { ClockLaws } from '../clock-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ClockSuite = <F>(F: Clock<F>) => {
  const laws = ClockLaws(F);

  return {
    clock: (
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet('clock', [
        [
          'clock monotonicity',
          () => {
            const result = laws.monotonicity();
            const True = F.applicative.pure(true);
            const E = mkEqF(Eq.primitive);
            if (typeof E === 'function')
              return expect(E(new IsEq(result, True))).resolves.toBe(true);
            return expect(E.equals(result, True)).toBe(true);
          },
        ],
      ]),
  };
};
