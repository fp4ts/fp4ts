// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import bcrypt from 'bcrypt';
import { Base, instance, Kind } from '@fp4ts/core';
import { Async, Sync } from '@fp4ts/effect';

export interface BcryptHash<F> extends Base<F> {
  hash(value: string): Kind<F, [string]>;
  compare(lhs: string, rhs: string): Kind<F, [boolean]>;
}

export const BcryptHash = Object.freeze({
  async: <F>(F: Async<F>): BcryptHash<F> =>
    instance({
      hash: value =>
        F.do(function* (_) {
          const salt = yield* _(
            F.fromPromise(F.delay(() => bcrypt.genSalt(10))),
          );
          const hashed = yield* _(
            F.fromPromise(F.delay(() => bcrypt.hash(value, salt))),
          );
          return hashed;
        }),

      compare: (lhs, rhs) =>
        F.fromPromise(F.delay(() => bcrypt.compare(lhs, rhs))),
    }),

  sync: <F>(F: Sync<F>): BcryptHash<F> =>
    instance({
      hash: value =>
        F.do(function* (_) {
          const salt = yield* _(F.delay(() => bcrypt.genSaltSync(10)));
          const hashed = yield* _(F.delay(() => bcrypt.hashSync(value, salt)));
          return hashed;
        }),

      compare: (lhs, rhs) => F.delay(() => bcrypt.compareSync(lhs, rhs)),
    }),
});
