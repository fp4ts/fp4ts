import crypto from 'crypto';
import { Lazy, PrimitiveType } from '@fp4ts/core';
import { Eq, primitiveEq } from './eq';

/**
 * @category Type Class
 */
export interface Hashable<A> extends Eq<A> {
  hash: (a: A) => string;
}

export const Hashable = Object.freeze({
  get primitiveMD5(): Hashable<PrimitiveType> {
    return primitiveMD5Hashable();
  },
});

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
