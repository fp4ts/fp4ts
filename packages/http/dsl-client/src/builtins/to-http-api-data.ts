// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ToHttpApiData } from '@fp4ts/http-dsl-shared';
import { boolean as b, string as s, number as n } from './plain-text';

export const boolean: ToHttpApiData<boolean> = ToHttpApiData.fromUniversal(
  b.encode,
);
export const number: ToHttpApiData<number> = ToHttpApiData.fromUniversal(
  n.encode,
);
export const string: ToHttpApiData<string> = ToHttpApiData.fromUniversal(
  s.encode,
);
