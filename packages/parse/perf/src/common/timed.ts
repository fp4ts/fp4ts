// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const timed = (msg: string, f: () => void): void => {
  const start = Date.now();
  f();
  const end = Date.now();
  console.log(`${msg}: ${end - start}ms`);
};
