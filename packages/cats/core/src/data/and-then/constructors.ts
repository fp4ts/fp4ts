// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { AndThen, isAndThen, Single } from './algebra';

export const identity = <A>(): AndThen<A, A> => lift(id);

export const pure = <A, B>(x: B): AndThen<A, B> => Single(() => x, 0);

export const lift = <A, B>(f: (a: A) => B): AndThen<A, B> =>
  isAndThen(f) ? f : Single(f, 0);
