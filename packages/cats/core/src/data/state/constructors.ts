// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { GetState, Pure, SetState, State } from './algebra';
import { flatMap_, map_ } from './operators';

export const pure = <S, A>(x: A): State<S, A> => new Pure(x);
export const unit = <S>(): State<S, void> => pure(undefined);

export const get = <S>(): State<S, S> => new GetState();

export const set = <S>(s: S): State<S, void> => new SetState(s);

export const update: <S>(f: (s: S) => S) => State<S, void> = f =>
  flatMap_(get(), s => set(f(s)));

export const updateAndGet: <S>(f: (s: S) => S) => State<S, S> = f =>
  flatMap_(get(), s => {
    const s2 = f(s);
    return map_(set(s2), () => s2);
  });

export const modify: <S, A>(f: (s: S) => [S, A]) => State<S, A> = f =>
  flatMap_(get(), s => {
    const [s2, a] = f(s);
    return map_(set(s2), () => a);
  });
