// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, flow, pipe } from '../function';

describe('Function', () => {
  const add = (x: number) => x + 1;
  const append = (x: number) => (s: string) => `${s}${x}`;

  describe('compose', () => {
    const maxArgs = [...new Array(7).keys()].map(x => x + 1);

    maxArgs
      .map(count => [...new Array(count)].map(() => add))
      .forEach(fns =>
        it(`should compose ${fns.length} functions`, () =>
          expect((compose as any)(...fns)(1)).toBe(fns.length + 1)),
      );

    maxArgs
      .map(count => [...new Array(count).keys()].map(idx => append(idx)))
      .forEach(fns =>
        it(`should apply ${fns.length} functions in reversed order`, () =>
          expect((compose as any)(...fns)('')).toBe(
            [...new Array(fns.length).keys()].reverse().join(''),
          )),
      );
  });

  describe('flow', () => {
    const maxArgs = [...new Array(7).keys()].map(x => x + 1);
    maxArgs
      .map(count => [...new Array(count)].map(() => add))
      .forEach(fns =>
        it(`should flow ${fns.length} functions`, () =>
          expect((flow as any)(...fns)(1)).toBe(fns.length + 1)),
      );

    maxArgs
      .map(count => [...new Array(count).keys()].map(idx => append(idx)))
      .forEach(fns =>
        it(`should apply ${fns.length} functions in order`, () =>
          expect((flow as any)(...fns)('')).toBe(
            [...new Array(fns.length).keys()].join(''),
          )),
      );
  });

  describe('pipe', () => {
    const maxArgs = [...new Array(14).keys()].map(x => x + 1);
    maxArgs
      .map(count => [...new Array(count)].map(() => add))
      .forEach(fns =>
        it(`should pipe ${fns.length} functions`, () =>
          expect((pipe as any)(1, ...fns)).toBe(fns.length + 1)),
      );

    maxArgs
      .map(count => [...new Array(count).keys()].map(idx => append(idx)))
      .forEach(fns =>
        it(`should apply ${fns.length} functions in order`, () =>
          expect((pipe as any)('', ...fns)).toBe(
            [...new Array(fns.length).keys()].join(''),
          )),
      );
  });
});
