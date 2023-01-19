// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IsEq } from './is-eq';

declare global {
  interface Object {
    '<=>'<A>(that: A): IsEq<A>;
  }
}

let patched = false;

export function patch(): void {
  if (patched || Object.prototype['<=>']) {
    return;
  }

  Object.defineProperty(Object.prototype, '<=>', {
    value<A>(this: A, that: A): IsEq<A> {
      return new IsEq(this, that);
    },
    enumerable: false,
    writable: true,
  });

  patched = true;
}

patch();
