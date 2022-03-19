// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import uuid from 'uuid';

import { Base, instance, Kind } from '@fp4ts/core';
import { Sync } from '@fp4ts/effect';
import { UUID } from './uuid';

export interface GenUUID<F> extends Base<F> {
  genUUID: Kind<F, [UUID]>;
}

export const GenUUID = Object.freeze({
  v4: <F>(F: Sync<F>): GenUUID<F> =>
    instance({ genUUID: F.delay(() => UUID.unsafeFromString(uuid.v4())) }),
});
