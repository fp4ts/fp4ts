interface TestSuite {
  readonly name: string;
  readonly parent?: TestSuite;
  readonly tests: [string, () => void][];
}
