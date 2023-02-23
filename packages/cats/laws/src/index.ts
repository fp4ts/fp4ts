// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/**
 * @module cats/laws
 */
export * from './alternative-laws';
export * from './applicative-error-laws';
export * from './applicative-laws';
export * from './apply-laws';
export * from './defer-laws';
export * from './distributive-laws';
export * from './flat-map-laws';
export * from './foldable-laws';
export * from './functor-filter-laws';
export * from './functor-laws';
export * from './invariant-laws';
export * from './monad-defer-laws';
export * from './monad-error-laws';
export * from './monad-laws';
export * from './monoid-k-laws';
export * from './semigroup-k-laws';
export * from './traversable-laws';
export * from './traversable-filter-laws';
export * from './unordered-foldable-laws';
export * from './unordered-traversable-laws';
export * from './bifunctor-laws';

export * from './align-laws';
export * from './unalign-laws';
export * from './unzip-laws';
export * from './zip-laws';

export * from './coflat-map-laws';
export * from './comonad-laws';

export * from './disciplines';

export * from '@fp4ts/cats-kernel-laws';
