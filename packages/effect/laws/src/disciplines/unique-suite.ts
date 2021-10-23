import { Kind } from '@cats4ts/core';
import { Applicative, Eq } from '@cats4ts/cats';
import { Unique } from '@cats4ts/effect-kernel';
import { exec, RuleSet } from '@cats4ts/cats-test-kit';
import { UniqueLaws } from '../unique-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const UniqueSuite = <F>(F: Unique<F> & Applicative<F>) => {
  const laws = UniqueLaws(F);

  return {
    unique: (mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>): RuleSet =>
      new RuleSet('unique', [
        ['unique uniqueness', exec(laws.uniqueness)(mkEqF(Eq.primitive))],
      ]),
  };
};
