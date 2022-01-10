// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Option, Right } from '@fp4ts/cats';
import {
  Alt,
  ApiElement,
  Capture,
  CaptureElement,
  Get,
  group,
  Query,
  QueryElement,
  Route,
  StaticElement,
  Sub,
  Verb,
} from '@fp4ts/http-dsl-shared/lib/api';
import { Type } from '@fp4ts/http-dsl-shared/lib/type';
import { DeriveCoding, serve } from './internal/server-derivable';

/**
 * @module http/dsl-server
 */
export {};

const x = group(
  Route('capture')[':>'](
    group(
      Route('boolean')
        [':>'](Capture.boolean('bool'))
        [':>'](Capture.string('str'))
        [':>'](Get),
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

serve(
  x,
  [
    [
      (x: boolean) => (y: string) => () => null as any as Response,
      (x: number) => () => null as any as Response,
      (x: string) => () => null as any as Response,
    ],
    [
      (x: Option<boolean>) => () => null as any as Response,
      (x: Option<number>) => () => null as any as Response,
      (x: Option<string>) => () => null as any as Response,
    ],
  ],
  {
    '@fp4ts/http/dsl/boolean': () => Right(true),
    '@fp4ts/http/dsl/number': () => Right(42),
    '@fp4ts/http/dsl/string': () => Right('string'),
  },
);

type x = { test: number };
type y = { test: string };
type z = x & y;

type T = DeriveCoding<typeof x>;
