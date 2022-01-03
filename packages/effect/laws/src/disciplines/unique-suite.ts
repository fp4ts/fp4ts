// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Eq } from '@fp4ts/cats';
import { Unique } from '@fp4ts/effect-kernel';
import { exec, RuleSet } from '@fp4ts/cats-test-kit';
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
