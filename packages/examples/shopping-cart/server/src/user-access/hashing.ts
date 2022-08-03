// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import bcrypt from 'bcrypt';
import { compose, Kind } from '@fp4ts/core';
import { Applicative } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import {
  Password,
  HashedPassword,
} from '@shopping-cart/common/lib/user-access';

export interface Hashing<F> {
  hash(password: Password): Kind<F, [HashedPassword]>;
  compare(password: Password, hash: HashedPassword): Kind<F, [boolean]>;
}
export const Hashing = Object.freeze({
  Bcrypt: {
    hash: (password: Password): IO<HashedPassword> =>
      IO.fromPromise(
        IO.delay(() => bcrypt.hash(Password.toString(password), 10)),
      ).map(HashedPassword),

    compare: (password: Password, hash: HashedPassword): IO<boolean> =>
      IO.fromPromise(
        IO.delay(() =>
          bcrypt.compare(
            Password.toString(password),
            HashedPassword.toString(hash),
          ),
        ),
      ),
  } as Hashing<IOF>,

  Identity: <F>(F: Applicative<F>): Hashing<F> => ({
    hash: compose(F.pure, HashedPassword, Password.toString),
    compare: (pwd: Password, h: HashedPassword): Kind<F, [boolean]> =>
      F.pure(Password.toString(pwd) === HashedPassword.toString(h)),
  }),
});
