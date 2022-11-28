// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, unsafeRunMain } from '@fp4ts/effect';
import { teletype, TeletypeIOC } from './teletype';

const main: IO<void> = teletype(TeletypeIOC.Algebra);

unsafeRunMain(main);
