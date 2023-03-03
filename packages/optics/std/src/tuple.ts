// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  IndexPreservingLens,
  IndexPreservingPLens,
  iplens,
} from '@fp4ts/optics-core';

/* eslint-disable prettier/prettier */

type Field1Tuple = readonly [unknown, ...unknown[]]
export function _1<A extends Field1Tuple, B>(): IndexPreservingPLens<A, Replace1<A, B>, A[0], B>;
export function _1<A extends Field1Tuple>(): IndexPreservingLens<A, A[0]>;
export function _1(): IndexPreservingLens<any, any> {
  return __1;
}

type Replace1<A extends readonly unknown[], B> = Replace<A, B, []>;

type Field2Tuple = readonly [unknown, unknown, ...unknown[]]
export function _2<A extends Field2Tuple, B>(): IndexPreservingPLens<A, Replace2<A, B>, A[1], B>;
export function _2<A extends Field2Tuple>(): IndexPreservingLens<A, A[1]>;
export function _2(): IndexPreservingLens<any, any> {
  return __2;
}

type Replace2<A extends readonly unknown[], B> = Replace<A, B, [any]>;

type Field3Tuple = readonly [unknown, unknown, unknown, ...unknown[]]
export function _3<A extends Field3Tuple, B>(): IndexPreservingPLens<A, Replace3<A, B>, A[2], B>;
export function _3<A extends Field3Tuple>(): IndexPreservingLens<A, A[2]>;
export function _3(): IndexPreservingLens<any, any> {
  return __3;
}

type Replace3<A extends readonly unknown[], B> = Replace<A, B, [any, any]>;

type Field4Tuple = readonly [unknown, unknown, unknown, unknown, ...unknown[]]
export function _4<A extends Field4Tuple, B>(): IndexPreservingPLens<A, Replace4<A, B>, A[3], B>;
export function _4<A extends Field4Tuple>(): IndexPreservingLens<A, A[3]>;
export function _4(): IndexPreservingLens<any, any> {
  return __4;
}

type Replace4<A extends readonly unknown[], B> = Replace<A, B, [any, any, any]>;

type Field5Tuple = readonly [unknown, unknown, unknown, unknown, unknown, ...unknown[]]
export function _5<A extends Field5Tuple, B>(): IndexPreservingPLens<A, Replace5<A, B>, A[4], B>;
export function _5<A extends Field5Tuple>(): IndexPreservingLens<A, A[4]>;
export function _5(): IndexPreservingLens<any, any> {
  return __5;
}

type Replace5<A extends readonly unknown[], B> = Replace<A, B, [any, any, any, any]>;

type Field6Tuple = readonly [unknown, unknown, unknown, unknown, unknown, unknown, ...unknown[]]
export function _6<A extends Field6Tuple, B>(): IndexPreservingPLens<A, Replace6<A, B>, A[5], B>;
export function _6<A extends Field6Tuple>(): IndexPreservingLens<A, A[5]>;
export function _6(): IndexPreservingLens<any, any> {
  return __6;
}

type Replace6<A extends readonly unknown[], B> = Replace<A, B, [any, any, any, any, any]>;

type Field7Tuple = readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, ...unknown[]]
export function _7<A extends Field7Tuple, B>(): IndexPreservingPLens<A, Replace7<A, B>, A[6], B>;
export function _7<A extends Field7Tuple>(): IndexPreservingLens<A, A[6]>;
export function _7(): IndexPreservingLens<any, any> {
  return __7;
}

type Replace7<A extends readonly unknown[], B> = Replace<A, B, [any, any, any, any, any, any]>;

type Field8Tuple = readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, ...unknown[]]
export function _8<A extends Field8Tuple, B>(): IndexPreservingPLens<A, Replace8<A, B>, A[7], B>;
export function _8<A extends Field8Tuple>(): IndexPreservingLens<A, A[7]>;
export function _8(): IndexPreservingLens<any, any> {
  return __8;
}

type Replace8<A extends readonly unknown[], B> = Replace<A, B, [any, any, any, any, any, any, any]>;

const atIndex = (i: number): IndexPreservingLens<unknown[], unknown> =>
  iplens(xs => xs[i], xs => x => { xs = [...xs]; xs[i] = x; return xs });


const __1 = atIndex(0);
const __2 = atIndex(1);
const __3 = atIndex(2);
const __4 = atIndex(3);
const __5 = atIndex(4);
const __6 = atIndex(5);
const __7 = atIndex(6);
const __8 = atIndex(7);


type Replace<
  A,
  B,
  prefix,
  result extends readonly unknown[] = []
> = prefix extends [any, ...infer prefix]
  ? A extends [infer h, ...infer A]
    ? Replace<A, B, prefix, [...result, h]>
    : never
  : A extends [any, ...infer A]
    ? [...result, B, ...A]
    : [...result, B];


