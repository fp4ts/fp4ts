// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Either, EitherT, Identity, Option, Right } from '@fp4ts/cats';
import { Method, Request, uri } from '@fp4ts/http-core';
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
import {
  DeriveCoding,
  route___,
  toHttpRoutes,
} from './internal/server-derivable';

/**
 * @module http/dsl-server
 */
export {};
