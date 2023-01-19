// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Strong } from '@fp4ts/cats';
import { Choice } from './choice';

export type Affine<P> = Strong<P> & Choice<P>;
