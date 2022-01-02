// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from './algebra';
import { intersection_, nullable, union_ } from './operators';

declare module './algebra' {
  interface Schema<A> {
    readonly nullable: Schema<A | null>;

    intersection<B>(that: Schema<B>): Schema<A & B>;
    '<&>'<B>(that: Schema<B>): Schema<A & B>;

    union<B>(that: Schema<B>): Schema<A & B>;
    '<|>'<B>(that: Schema<B>): Schema<A & B>;
  }
}

Object.defineProperty(Schema.prototype, 'nullable', {
  get<A>(this: Schema<A>): Schema<A | null> {
    return nullable(this);
  },
});

Schema.prototype.intersection = function (that) {
  return intersection_(this, that);
};
Schema.prototype['<&>'] = Schema.prototype.intersection;

Schema.prototype.union = function (that) {
  return union_(this, that);
};
Schema.prototype['<|>'] = Schema.prototype.union;
