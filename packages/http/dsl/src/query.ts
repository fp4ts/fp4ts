// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ParamParser } from './internal';

export class QueryParam<N extends string, A> {
  private readonly __void!: void;
  public constructor(
    public readonly name: N,
    public readonly parser: ParamParser<A>,
  ) {}
}

export const Query = Object.freeze({
  boolean: <N extends string>(n: N): QueryParam<N, boolean> =>
    new QueryParam(n, x => ParamParser.boolean(x)),
  number: <N extends string>(n: N): QueryParam<N, number> =>
    new QueryParam(n, x => ParamParser.number(x)),
  string: <N extends string>(n: N): QueryParam<N, string> =>
    new QueryParam(n, x => ParamParser.string(x)),
});
