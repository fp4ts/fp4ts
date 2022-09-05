// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from './algebra';
import { array } from './constructors';
import { as_, imap_, nullable } from './operators';
import { SchemaRef } from './schema-ref';

declare module './algebra' {
  interface Schema<A> {
    readonly array: Schema<A[]>;
    readonly nullable: Schema<A | null>;

    imap<B>(f: (a: A) => B, g: (b: B) => A): Schema<B>;
    as<Ref extends string>(Ref: Ref): SchemaRef<Ref, A>;

    // intersection<B>(that: Schema<B>): Schema<A & B>;
    // '<&>'<B>(that: Schema<B>): Schema<A & B>;
  }
}

Object.defineProperty(Schema.prototype, 'array', {
  get<A>(this: Schema<A>): Schema<A[]> {
    return array(this);
  },
});
Object.defineProperty(Schema.prototype, 'nullable', {
  get<A>(this: Schema<A>): Schema<A | null> {
    return nullable(this);
  },
});

// Schema.prototype.intersection = function (that) {
//   return intersection_(this, that);
// };
// Schema.prototype['<&>'] = Schema.prototype.intersection;

Schema.prototype.imap = function (f, g) {
  return imap_(this, f, g);
};

Schema.prototype.as = function (Ref) {
  return as_(this, Ref);
};
