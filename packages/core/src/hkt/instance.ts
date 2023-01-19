// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base } from './base';

const _TypeClassKey = Symbol('fp4ts/type-class-key');
type _TypeClassKey = typeof _TypeClassKey;

export const instance = <T>(_: Omit<T, `_${any}`>): T =>
  ({ ..._, [_TypeClassKey]: true } as any);

export const isTypeClassInstance = <F extends Base<any>>(u: any): u is F =>
  u && typeof u === 'object' && _TypeClassKey in u;
