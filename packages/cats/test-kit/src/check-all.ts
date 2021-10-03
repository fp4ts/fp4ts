import { RuleSet } from './rule-set';

export function checkAll(setName: string, rs: RuleSet): void {
  describe(setName, () => {
    const setsToRun = collectSuites(rs);

    for (const { name, rules } of setsToRun) {
      describe(name, () => {
        for (const [testName, t] of rules) {
          test(testName, t, 60_000);
        }
      });
    }
  });
}

const collectSuites = (rs: RuleSet): RuleSet[] => {
  const sets: RuleSet[] = [];
  if (rs.parentProps.parent) {
    sets.push(...collectSuites(rs.parentProps.parent));
  }

  if (rs.parentProps.parents) {
    for (const rsi of rs.parentProps.parents) {
      sets.push(...collectSuites(rsi));
    }
  }

  sets.push(rs);
  return sets;
};
