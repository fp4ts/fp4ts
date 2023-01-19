// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const BITS = 5;
export const WIDTH = 1 << BITS;
export const MASK = WIDTH - 1;
export const BITS2 = BITS * 2;
export const WIDTH2 = 1 << BITS2;
export const BITS3 = BITS * 3;
export const WIDTH3 = 1 << BITS3;
export const BITS4 = BITS * 4;
export const WIDTH4 = 1 << BITS4;
export const BITS5 = BITS * 5;
export const WIDTH5 = 1 << BITS5;
export const BITS6 = BITS * 6;
export const WIDTH6 = 1 << BITS6;
export const LASTWIDTH = WIDTH << 1; // 1 extra bit in the last level to go up to Int.MaxValue (2^31-1) instead of 2^30:
export const Log2ConcatFaster = 5;

export type Arr1 = unknown[];
export type Arr2 = unknown[][];
export type Arr3 = unknown[][][];
export type Arr4 = unknown[][][][];
export type Arr5 = unknown[][][][][];
export type Arr6 = unknown[][][][][][];
