// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  const acc = new Map<string, Rule[]>();
  const loop = (rs: RuleSet): void => {
    acc.set(rs.name, rs.rules);

    if (rs.parentProps.parents) {
      return rs.parentProps.parents.forEach(loop);
    }

    if (rs.parentProps.parent) {
      return loop(rs.parentProps.parent);
    }
  };

  loop(rs);

  return [...acc.entries()];
};
