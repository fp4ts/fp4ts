// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ParamParser } from './internal';

export class CaptureParam<N extends string, A> {
  public constructor(
    public readonly name: N,
    public readonly parser: ParamParser<A>,
  ) {}
}

export const Capture = Object.freeze({
  boolean: <N extends string>(n: N): CaptureParam<N, boolean> =>
    new CaptureParam(n, ParamParser.boolean),
  number: <N extends string>(n: N): CaptureParam<N, number> =>
    new CaptureParam(n, ParamParser.number),
  string: <N extends string>(n: N): CaptureParam<N, string> =>
    new CaptureParam(n, ParamParser.string),
});
