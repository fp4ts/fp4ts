// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/**
 * @category Type Class
 */
export interface Show<A> {
  readonly show: (a: A) => string;
}

export const Show = {
  fromToString: <A>(): Show<A> => ({
    show: x => `${x}`,
  }),
};
