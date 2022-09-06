// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, α, β, λ } from '@fp4ts/core';
import { Profunctor, Strong } from '@fp4ts/cats-core';
import { Chain } from '@fp4ts/cats-core/lib/data';
import { IxRWS, IxRWSF } from './ix-rws';

export type IxState<S1, S2, A> = IxRWS<unknown, Chain<never>, S1, S2, A>;

export const IxState: IxStateObj = function (runIxState) {
  return IxState.state(runIxState);
};

interface IxStateObj {
  <S1, S2, A>(runIxState: (s1: S1) => [A, S2]): IxState<S1, S2, A>;
  pure<S, A>(a: A): IxState<S, S, A>;
  state<S1, S2, A>(f: (s1: S1) => [A, S2]): IxState<S1, S2, A>;

  get<S>(): IxState<S, S, S>;
  set<S2>(s2: S2): IxState<unknown, S2, void>;
  modify<S1, S2>(f: (s1: S1) => S2): IxState<S1, S2, void>;

  // -- Instances

  Profunctor<A>(): Profunctor<IxStateFA<A>>;
  Strong<A>(): Strong<IxStateFA<A>>;
}

IxState.pure = IxRWS.pure;
IxState.state = IxRWS.state<Chain<never>>();
IxState.get = IxRWS.get;
IxState.set = IxRWS.set;
IxState.modify = IxRWS.modify<Chain<never>>();

IxState.Profunctor = IxRWS.Profunctor;
IxState.Strong = IxRWS.Strong;

// -- HKT

export type IxStateF<S1, S2> = $<IxRWSF, [unknown, Chain<never>, S1, S2]>;

export type IxStateFA<A> = λ<
  IxRWSF,
  [Fix<unknown>, Fix<Chain<never>>, α, β, Fix<A>]
>;
