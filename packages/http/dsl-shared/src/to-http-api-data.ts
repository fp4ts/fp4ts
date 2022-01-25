// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const ToHttpApiDataTag = '@fp4ts/http/dsl/to-htt-api-data';
export type ToHttpApiDataTag = typeof ToHttpApiDataTag;

export interface ToHttpApiData<A> {
  toPathComponent(x: A): string;
  toQueryParameter(x: A): string;
  toHeader(x: A): string;
}

export const ToHttpApiData = Object.freeze({
  fromUniversal: <A>(f: (x: A) => string): ToHttpApiData<A> => ({
    toPathComponent: f,
    toQueryParameter: f,
    toHeader: f,
  }),
});
