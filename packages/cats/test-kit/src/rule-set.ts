interface ParentProps {
  readonly parent?: RuleSet;
  readonly parents?: RuleSet[];
}

export type Rule = [string, () => void];

export class RuleSet {
  public constructor(
    public readonly name: string,
    public readonly rules: Rule[],
    public readonly parentProps: ParentProps = {},
  ) {}
}
