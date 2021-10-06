import { TestExecutionContext } from './test-execution-context';

export class Ticker {
  public constructor(
    public readonly ctx: TestExecutionContext = new TestExecutionContext(),
  ) {}
}
