// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { Encoder } from './algebra';
import {
  andThen_,
  compose_,
  contramap_,
  intersection_,
  map_,
  nullable,
  optional,
} from './operators';

declare module './algebra' {
  interface Encoder<O, A> {
    readonly nullable: Encoder<O | null, A | null>;
    readonly optional: Encoder<O | undefined, A | undefined>;

    map<O2>(f: (o: O) => O2): Encoder<O2, A>;
    contramap<AA>(f: (aa: AA) => A): Encoder<O, AA>;

    andThen<OO, O2>(
      this: Encoder<OO, A>,
      that: Encoder<O2, OO>,
    ): Encoder<O2, A>;
    compose<AA, B>(this: Encoder<O, AA>, that: Encoder<AA, B>): Encoder<O, B>;

    intersection<B, O2>(that: Encoder<O2, B>): Encoder<O & O2, A & B>;
    '<&>'<B, O2>(that: Encoder<O2, B>): Encoder<O & O2, A & B>;
  }
}

Object.defineProperty(Encoder.prototype, 'nullable', {
  get<O, A>(this: Encoder<O, A>): Encoder<O | null, A | null> {
    return nullable(this);
  },
});
Object.defineProperty(Encoder.prototype, 'optional', {
  get<O, A>(this: Encoder<O, A>): Encoder<O | undefined, A | undefined> {
    return optional(this);
  },
});

Encoder.prototype.map = function (f) {
  return map_(this, f);
};
Encoder.prototype.contramap = function (f) {
  return contramap_(this, f);
};
Encoder.prototype.andThen = function (that) {
  return andThen_(this, that);
};
Encoder.prototype.compose = function (that) {
  return compose_(this, that);
};
Encoder.prototype.intersection = function (that) {
  return intersection_(this, that);
};
Encoder.prototype['<&>'] = Encoder.prototype.intersection;
