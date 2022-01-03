// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { AndThen } from './algebra';
import { andThen_, compose_ } from './operators';

declare module './algebra' {
  interface AndThen<A, B> {
    andThen<C>(g: (b: B) => C): AndThen<A, C>;
    '>>>'<C>(g: (b: B) => C): AndThen<A, C>;

    compose<AA>(g: (aa: AA) => A): AndThen<AA, B>;
    '<<<'<AA>(g: (aa: AA) => A): AndThen<AA, B>;
  }
}

AndThen.prototype.andThen = function (g) {
  return andThen_(this, g);
};
AndThen.prototype['>>>'] = AndThen.prototype.andThen;

AndThen.prototype.compose = function (g) {
  return compose_(this, g);
};
AndThen.prototype['<<<'] = AndThen.prototype.compose;
