// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Capture, Get, group, Query, Route } from './api';

/**
 * @module http/dsl-shared
 */
export {};

const x = group(
  Route('capture')[':>'](
    group(
      Route('boolean')[':>'](Capture.boolean('bool'))[':>'](Get),
      Route('number')[':>'](Capture.number('num'))[':>'](Get),
      Route('string')[':>'](Capture.string('str'))[':>'](Get),
    ),
  ),
  Route('query')[':>'](
    group(
      Route('boolean')[':>'](Query.boolean('bool'))[':>'](Get),
      Route('number')[':>'](Query.number('num'))[':>'](Get),
      Route('string')[':>'](Query.string('str'))[':>'](Get),
    ),
  ),
);

console.log(JSON.stringify(x, null, 2));
