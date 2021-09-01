import crypto from 'crypto';
import { Lazy } from '../fp/core';
import { PrimitiveType } from '../fp/primitive-type';
import { Eq, primitiveEq } from './eq';

export interface Hashable<A> extends Eq<A> {
  hash: (a: A) => string;
}

// HKT

export const URI = 'cats/hashable';
export type URI = typeof URI;

declare module '../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Hashable<A>;
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
