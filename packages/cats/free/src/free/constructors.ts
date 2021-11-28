// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Free, Pure, Suspend } from './algebra';

export const pure = <F, A>(a: A): Free<F, A> => new Pure(a);

export const suspend = <F, A>(fa: Kind<F, [A]>): Free<F, A> => new Suspend(fa);
