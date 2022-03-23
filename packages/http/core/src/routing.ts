// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Prism } from '@fp4ts/optics';
import { Method, Request, Path } from './messages';

export const Method_ =
  (m: Method) =>
  <F>(path: Path): Prism<Request<F>, Request<F>> =>
    Prism.filter(req => req.method === m && req.uri.path.startsWith(path));

export const AnyMethod_ = <F>(path: Path): Prism<Request<F>, Request<F>> =>
  Prism.filter(req => req.uri.path.startsWith(path));

export const Get_ = Method_(Method.GET);
export const Post_ = Method_(Method.POST);
export const Put_ = Method_(Method.PUT);
export const Patch_ = Method_(Method.PATCH);
export const Delete_ = Method_(Method.DELETE);
