// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { AndThen, Single } from './algebra';

export const identity = <A>(): AndThen<A, A> => lift(id);

export const pure = <A, B>(x: B): AndThen<A, B> => new Single(() => x, 0);

export const lift = <A, B>(f: (a: A) => B): AndThen<A, B> =>
  f instanceof AndThen ? f : new Single(f, 0);
