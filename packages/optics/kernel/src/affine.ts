// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Strong, Choice } from '@fp4ts/cats-profunctor';

export type Affine<P> = Strong<P> & Choice<P>;
