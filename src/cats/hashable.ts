import crypto from 'crypto';
import { Lazy } from '../core';
import { PrimitiveType } from '../fp/primitive-type';
import { Eq, primitiveEq } from './eq';

export interface Hashable<A> extends Eq<A> {
  hash: (a: A) => string;
}

// HKT

export const HashableURI = 'cats/hashable';
export type HashableURI = typeof HashableURI;

declare module '../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [HashableURI]: Hashable<Tys[0]>;
  }
}

// Instances

export const primitiveMD5Hashable: Lazy<Hashable<PrimitiveType>> = () => ({
  ...primitiveEq(),
  hash: val => {
    const h = crypto.createHash('md5');
    if (
      typeof val === 'number' ||
      typeof val === 'bigint' ||
      typeof val === 'boolean'
    ) {
      h.update(val.toString());
    } else {
      h.update(val);
    }
    return h.digest('hex').toString();
  },
});
