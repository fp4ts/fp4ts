// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
