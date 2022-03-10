// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export function applyMixins(
  derivedCtor: any,
  ...constructors: [any, ...any[]]
) {
  for (const baseCtor of constructors) {
    for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
      if (derivedCtor.prototype.hasOwnProperty(name)) {
        // Do not override already existing properties
        continue;
      }
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ??
          Object.create(null),
      );
    }
  }
}
