// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { List, Monad, MonadRequirements, Option } from '@fp4ts/cats';
import { Source } from './source';
import { TokenType } from './token-type';

export interface Stream<S, M> extends Monad<M> {
  uncons(s: S): Kind<M, [Option<[TokenType<S>, S]>]>;
}
export type StreamRequirements<S, M> = Pick<Stream<S, M>, 'uncons'> &
  MonadRequirements<M> &
  Partial<Stream<S, M>>;
export const Stream = Object.freeze({
  of: <S, M>(S: StreamRequirements<S, M>): Stream<S, M> => ({
    ...Monad.of(S),
    ...S,
  }),

  forList: <M, A>(M: Monad<M>): Stream<List<A>, M> =>
    Stream.of({
      uncons: xs => M.pure(xs.uncons),
      ...M,
    }),

  forSource: <M, S extends Source<any, any>>(M: Monad<M>): Stream<S, M> =>
    Stream.of({
      uncons: s => M.pure(s.uncons),
      ...M,
    }),
});
