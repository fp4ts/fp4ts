// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Fragment } from './free';

export { Fragment } from './free';

export function fr(strings: TemplateStringsArray, ...xs: unknown[]): Fragment {
  return fr0(strings, ...xs)['+++'](Fragment.query(' '));
}

export function fr0(strings: TemplateStringsArray, ...xs: unknown[]): Fragment {
  let acc: Fragment = Fragment.empty;
  let i = 0;
  let j = 0;
  while (i < strings.length && j < xs.length) {
    acc = acc['+++'](Fragment.query(strings[i++]));
    acc = acc['+++'](Fragment.param(xs[j++]));
  }
  while (i < strings.length) {
    acc = acc['+++'](Fragment.query(strings[i++]));
  }
  while (j < xs.length) {
    acc = acc['+++'](Fragment.param(xs[j++]));
  }
  return acc;
}

export function sql(strings: TemplateStringsArray, ...xs: unknown[]): Fragment {
  return fr0(strings, ...xs);
}
