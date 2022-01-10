// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Capture, GetNoContent, group, Query, Route } from './api';

/**
 * @module http/dsl-shared
 */
export {};

const x = group(
  Route('capture')[':>'](
    group(
      Route('boolean')[':>'](Capture.boolean('bool'))[':>'](GetNoContent),
      Route('number')[':>'](Capture.number('num'))[':>'](GetNoContent),
      Route('string')[':>'](Capture.string('str'))[':>'](GetNoContent),
    ),
  ),
  Route('query')[':>'](
    group(
      Route('boolean')[':>'](Query.boolean('bool'))[':>'](GetNoContent),
      Route('number')[':>'](Query.number('num'))[':>'](GetNoContent),
      Route('string')[':>'](Query.string('str'))[':>'](GetNoContent),
    ),
  ),
);

console.log(JSON.stringify(x, null, 2));
