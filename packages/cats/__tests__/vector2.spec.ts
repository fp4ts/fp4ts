// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Vector } from '@fp4ts/cats-core/lib/data';
// import { forAll } from '@fp4ts/cats-test-kit';
// import fc from 'fast-check';

describe('Vector', () => {
  it('should create a vector from an array', () => {
    expect(Vector.fromArray([1, 2, 3, 4, 5]).toArray).toEqual([1, 2, 3, 4, 5]);
  });

  it('should map elements of the vector', () => {
    expect(Vector.fromArray([1, 2, 3, 4, 5]).map(x => `${x}`).toArray).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
  });

  it('should map many elements', () => {
    const xs = [...new Array(100_000).keys()].map((_, i) => i);
    const rs = Vector.fromArray(xs).map(x => `${x}`);
    expect(rs.toArray).toEqual(xs.map(x => `${x}`));
  });

  const xs = [...new Array(1_000_000).keys()].map((_, i) => i);
  const ys = Vector.fromArray(xs);
  it('should slice half', () => {
    expect(ys.slice(0, 500_000).toArray).toEqual(xs.slice(0, 500_000));
  });
  it('should second half', () => {
    expect(ys.slice(500_000, 1_000_000).toArray).toEqual(
      xs.slice(500_000, 1_000_000),
    );
  });
  it('should middle half', () => {
    expect(ys.slice(250_000, 750_000).toArray).toEqual(
      xs.slice(250_000, 750_000),
    );
  });

  // test('isomorphism with array', () => {
  //   fc.assert(
  //     fc.property(fc.integer({ min: 0, max: 100_000 }), size => {
  //       const xs = new Array(size);
  //       for (let i = 0; i < size; i++) {
  //         xs[i] = i;
  //       }
  //       expect(Vector.fromArray(xs).toArray).toEqual(xs);
  //     }),
  //     { numRuns: 50 },
  //   );
  // });

  // test('isomorphism with array', () => {
  //   fc.assert(
  //     fc.property(fc.integer({ min: 1_000_000, max: 10_000_000 }), size => {
  //       const xs = new Array(size);
  //       for (let i = 0; i < size; i++) {
  //         xs[i] = i;
  //       }
  //       expect(Vector.fromArray(xs).toArray).toEqual(xs);
  //     }),
  //     { numRuns: 5 },
  //   );
  // });
});
