export function checkAll(checkName: string, ts: TestSuite): void {
  describe(checkName, () => {
    const suitesToRun: TestSuite[] = [ts];
    let iter = ts.parent;
    while (iter != null) {
      suitesToRun.push(iter);
      iter = iter.parent;
    }

    for (const { name, tests } of suitesToRun) {
      describe(name, () => {
        for (const [testName, t] of tests) {
          test(testName, t);
        }
      });
    }
  });
}
