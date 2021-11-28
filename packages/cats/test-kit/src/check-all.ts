// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { OrderedMap } from '@fp4ts/cats-core/lib/data';
import { Rule, RuleSet } from './rule-set';

export function checkAll(setName: string, rs: RuleSet): void {
  describe(setName, () => {
    const setsToRun = collectSuites(rs);

    for (const [name, rules] of setsToRun) {
      describe(name, () => {
        for (const [testName, t] of rules) {
          test(testName, t, 5_000);
        }
      });
    }
  });
}

const collectSuites = (rs: RuleSet): [string, Rule[]][] => {
  const loop = (
    acc: OrderedMap<string, Rule[]>,
    rs: RuleSet,
  ): OrderedMap<string, Rule[]> => {
    acc = acc.insert(rs.name, rs.rules);

    if (rs.parentProps.parents) {
      return rs.parentProps.parents.reduce(loop, acc);
    }

    if (rs.parentProps.parent) {
      return loop(acc, rs.parentProps.parent);
    }

    return acc;
  };

  return loop(OrderedMap.empty, rs).toArray;
};
