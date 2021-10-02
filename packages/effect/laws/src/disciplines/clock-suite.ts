import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { Clock } from '@cats4ts/effect-kernel';
import { RuleSet } from '@cats4ts/cats-test-kit';
import { ClockLaws } from '../clock-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ClockSuite = <F extends AnyK>(F: Clock<F>) => {
  const laws = ClockLaws(F);

  return {
    clock: (mkEqF: <X>(EX: Eq<X>) => Eq<Kind<F, [X]>>): RuleSet =>
      new RuleSet('clock', [
        [
          'clock monotonicity',
          () => {
            const result = laws.monotonicity();
            const True = F.applicative.pure(true);
            expect(mkEqF(Eq.primitive).equals(result, True)).toBe(true);
          },
        ],
      ]),
  };
};
