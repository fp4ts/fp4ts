// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind } from '@fp4ts/core';
import { LazyList, List, Monad, Option } from '@fp4ts/cats';
import { Source } from './source';
import { TokenType } from './token-type';

export interface Stream<S, F> extends Base<F> {
  readonly monad: Monad<F>;
  uncons(s: S): Kind<F, [Option<[TokenType<S>, S]>]>;
}
export type StreamRequirements<S, F> = Pick<Stream<S, F>, 'uncons' | 'monad'> &
  Partial<Stream<S, F>>;
export const Stream = Object.freeze({
  of: <S, F>(S: StreamRequirements<S, F>): Stream<S, F> =>
    instance<Stream<S, F>>({
      ...S,
    }),

  forList: <F, A>(M: Monad<F>): Stream<List<A>, F> =>
    Stream.of({ monad: M, uncons: xs => M.pure(xs.uncons) }),

  forLazyList: <F, A>(M: Monad<F>): Stream<LazyList<A>, F> =>
    Stream.of({ monad: M, uncons: xs => M.pure(xs.uncons) }),

  forSource: <F, S extends Source<any, any>>(M: Monad<F>): Stream<S, F> =>
    Stream.of({ monad: M, uncons: s => M.pure(s.uncons) }),
});
