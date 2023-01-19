// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FromHttpApiData } from '@fp4ts/http-dsl-shared';
import { boolean as b, string as s, number as n } from './plain-text';

export const boolean: FromHttpApiData<boolean> = FromHttpApiData.fromUniversal(
  b.decode,
);
export const number: FromHttpApiData<number> = FromHttpApiData.fromUniversal(
  n.decode,
);
export const string: FromHttpApiData<string> = FromHttpApiData.fromUniversal(
  s.decode,
);
