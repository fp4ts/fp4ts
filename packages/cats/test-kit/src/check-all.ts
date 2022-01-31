// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Map } from '@fp4ts/cats-core/lib/data';
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
  const loop = (acc: Map<string, Rule[]>, rs: RuleSet): Map<string, Rule[]> => {
    acc = acc.insert(rs.name, rs.rules);

    if (rs.parentProps.parents) {
      return rs.parentProps.parents.reduce(loop, acc);
    }

    if (rs.parentProps.parent) {
      return loop(acc, rs.parentProps.parent);
    }

    return acc;
  };

  return loop(Map.empty, rs).toArray;
};
