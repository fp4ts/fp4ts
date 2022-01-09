// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind } from '@fp4ts/core';
import { Applicative } from '../../applicative';
import { FunctionK } from '../../arrow';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Eval } from '../../eval';

import type { State } from './index-state-t';
import { IndexedStateT } from './algebra';
import {
  bimap_,
  contramap_,
  dimap_,
  flatMapF_,
  flatMap_,
  get_,
  inspect_,
  mapK_,
  map_,
  modify_,
  runA_,
  runS_,
  run_,
  transformF_,
  transform_,
} from './operators';

declare module './algebra' {
  interface IndexedStateT<F, SA, SB, A> {
    map<B, S = SA & SB>(this: State<S, A>, f: (a: A) => B): State<S, B>;
    map(F: Functor<F>): <B>(f: (a: A) => B) => IndexedStateT<F, SA, SB, B>;
    mapK(
      F: Functor<F>,
    ): <G>(nt: FunctionK<F, G>) => IndexedStateT<G, SA, SB, A>;

    flatMap<B, S = SA & SB>(
      this: State<S, A>,
      f: (a: A) => State<S, B>,
    ): State<S, B>;
    flatMap(
      F: FlatMap<F>,
    ): <B, SC>(
      f: (a: A) => IndexedStateT<F, SB, SC, B>,
    ) => IndexedStateT<F, SA, SC, B>;
    flatMapF(
      F: FlatMap<F>,
    ): <B>(f: (a: A) => Kind<F, [B]>) => IndexedStateT<F, SA, SB, B>;

    contramap(
      F: Functor<F>,
    ): <S0>(f: (s0: S0) => SA) => IndexedStateT<F, S0, SB, A>;

    bimap(
      F: Functor<F>,
    ): <SC, B>(
      f: (sb: SB) => SC,
      g: (a: A) => B,
    ) => IndexedStateT<F, SA, SC, B>;

    dimap(
      F: Functor<F>,
    ): <S0, S1>(
      f: (s0: S0) => SA,
      g: (sb: SB) => S1,
    ) => IndexedStateT<F, S0, S1, A>;

    transform<B, S = SA & SB>(
      this: State<S, A>,
      f: (sa: [S, A]) => [S, B],
    ): State<S, B>;
    transform<F>(
      F: Functor<F>,
    ): <B, SC>(f: (sba: [SB, A]) => [SC, B]) => IndexedStateT<F, SA, SC, B>;
    transformF<G>(
      F: FlatMap<F>,
      G: Applicative<G>,
    ): <B, SC>(
      f: (sba: [SB, A]) => Kind<G, [[SC, B]]>,
    ) => IndexedStateT<F, SA, SC, B>;

    modify<S = SA & SB>(this: State<SA & SB, A>, f: (sa: S) => S): State<S, A>;
    modify(
      F: Functor<F>,
    ): <SC>(f: (sb: SB) => SC) => IndexedStateT<F, SA, SC, A>;

    inspect<B, S = SA & SB>(this: State<S, A>, f: (s: S) => B): State<S, B>;
    inspect(
      F: Functor<F>,
    ): <B>(f: (sb: SB) => B) => IndexedStateT<F, SA, SB, B>;

    get<S = SA & SB>(): State<S, S>;
    get(F: Functor<F>): IndexedStateT<F, SA, SB, SB>;

    run<S = SA & SB>(this: State<S, A>, initial: S): Eval<[S, A]>;
    run(F: FlatMap<F>): (initial: SA) => Kind<F, [[SB, A]]>;

    runS<S = SA & SB>(this: State<S, A>, initial: S): Eval<S>;
    runS(F: FlatMap<F>): (initial: SA) => Kind<F, [SB]>;

    runA<S = SA & SB>(this: State<S, A>, initial: S): Eval<A>;
    runA(F: FlatMap<F>): (initial: SA) => Kind<F, [A]>;
  }
}

IndexedStateT.prototype.map = function (this: any, F: any) {
  return isTypeClassInstance<Functor<any>>(F)
    ? (f: any) => map_(F)(this, f)
    : map_(Eval.Functor)(this, F);
} as any;
IndexedStateT.prototype.mapK = function (F) {
  return nt => mapK_(F)(this, nt);
};

IndexedStateT.prototype.flatMap = function (this: any, F: any) {
  return isTypeClassInstance<FlatMap<any>>(F)
    ? (f: any) => flatMap_(F)(this, f)
    : flatMap_(Eval.FlatMap)(this, F);
} as any;
IndexedStateT.prototype.flatMapF = function (F) {
  return f => flatMapF_(F)(this, f);
};

IndexedStateT.prototype.contramap = function (F) {
  return f => contramap_(F)(this, f);
};
IndexedStateT.prototype.bimap = function (F) {
  return (f, g) => bimap_(F)(this, f, g);
};
IndexedStateT.prototype.dimap = function (F) {
  return (f, g) => dimap_(F)(this, f, g);
};

IndexedStateT.prototype.transform = function (this: any, F: any) {
  return isTypeClassInstance<Functor<any>>(F)
    ? (f: any) => transform_(F)(this, f)
    : transform_(Eval.Functor)(this, F);
} as any;
IndexedStateT.prototype.transformF = function (F, G) {
  return f => transformF_(F, G)(this, f);
};

IndexedStateT.prototype.modify = function (this: any, F: any) {
  return isTypeClassInstance<Functor<any>>(F)
    ? (f: any) => modify_(F)(this, f)
    : modify_(Eval.Functor)(this, F);
} as any;
IndexedStateT.prototype.inspect = function (this: any, F: any) {
  return isTypeClassInstance<Functor<any>>(F)
    ? (f: any) => inspect_(F)(this, f)
    : inspect_(Eval.Functor)(this, F);
} as any;
IndexedStateT.prototype.get = function (F = Eval.Functor) {
  return get_(F)(this);
};
IndexedStateT.prototype.run = function (this: any, F: any) {
  return isTypeClassInstance<FlatMap<any>>(F)
    ? (initial: any) => run_(F)(this, initial)
    : run_(Eval.FlatMap)(this, F);
} as any;
IndexedStateT.prototype.runS = function (this: any, F: any) {
  return isTypeClassInstance<FlatMap<any>>(F)
    ? (initial: any) => runS_(F)(this, initial)
    : runS_(Eval.FlatMap)(this, F);
} as any;
IndexedStateT.prototype.runA = function (this: any, F: any) {
  return isTypeClassInstance<FlatMap<any>>(F)
    ? (initial: any) => runA_(F)(this, initial)
    : runA_(Eval.FlatMap)(this, F);
} as any;
