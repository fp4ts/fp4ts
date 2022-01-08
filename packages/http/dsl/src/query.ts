// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option, Some } from '@fp4ts/cats';
import { ParamParser } from './internal';

export class QueryParam<N extends string, A> {
  public constructor(
    public readonly name: N,
    public readonly parser: ParamParser<A>,
  ) {}
}

export const Query = Object.freeze({
  boolean: <N extends string>(n: N): QueryParam<N, Option<boolean>> =>
    new QueryParam(n, x => ParamParser.boolean(x).map(Some)),
  number: <N extends string>(n: N): QueryParam<N, Option<number>> =>
    new QueryParam(n, x => ParamParser.number(x).map(Some)),
  string: <N extends string>(n: N): QueryParam<N, Option<string>> =>
    new QueryParam(n, x => ParamParser.string(x).map(Some)),
});
