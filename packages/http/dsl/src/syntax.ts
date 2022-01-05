// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ApiElement, PathElement } from './api-element';
import { ApiGroup } from './api-group';
import { ApiList } from './api-list';

declare module './api-element' {
  interface ApiElement {
    ':>'<S extends string>(that: S): ApiList<[this, PathElement<S>]>;
    ':>'<A extends unknown[]>(that: ApiList<A>): ApiList<[this, ...A]>;
    ':>'<E extends ApiElement>(that: E): ApiList<[this, E]>;
    ':>'<G extends ApiGroup<any>>(that: G): ApiList<[this, G]>;
  }
}
ApiElement.prototype[':>'] = function (this: ApiElement, that: any) {
  if (typeof that === 'string')
    return new ApiList([this, new PathElement(that)]);
  if (that instanceof ApiList) return new ApiList([this, ...that.elements]);
  if (that instanceof ApiElement) return new ApiList([this, that]);
  if (that instanceof ApiGroup) return new ApiList([this, that]);
  throw new Error();
} as ApiElement[':>'];

declare module './api-list' {
  interface ApiList<A extends unknown[]> {
    ':>'<S extends string>(that: S): ApiList<[...A, PathElement<S>]>;
    ':>'<E extends ApiElement>(that: E): ApiList<[...A, E]>;
    ':>'<B extends unknown[]>(that: ApiList<B>): ApiList<[...A, ...B]>;
    ':>'<G extends ApiGroup<any>>(that: G): ApiList<[...A, G]>;
  }
}

ApiList.prototype[':>'] = function (this: any, that: any) {
  if (typeof that === 'string')
    return new ApiList([...this.elements, new PathElement(that)]);
  if (that instanceof ApiElement) return new ApiList([...this.elements, that]);
  if (that instanceof ApiList)
    return new ApiList([...this.elements, ...that.elements]);
  if (that instanceof ApiGroup) return new ApiList([...this.elements, that]);
  throw new Error();
} as ApiList<any>[':>'];
