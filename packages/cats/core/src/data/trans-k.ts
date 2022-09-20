// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Kind, Lazy } from '@fp4ts/core';
import { CommutativeMonoid, Monoid } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { ApplicativeError } from '../applicative-error';
import { Apply } from '../apply';
import { Contravariant } from '../contravariant';
import { Eval } from '../eval';
import { FlatMap } from '../flat-map';
import { Foldable } from '../foldable';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { Invariant } from '../invariant';
import { MonadError } from '../monad-error';
import { SemigroupK } from '../semigroup-k';
import { Traversable } from '../traversable';
import { UnorderedFoldable } from '../unordered-foldable';
import { UnorderedTraversable } from '../unordered-traversable';
import { Either } from './either';
import { Option } from './option';

export type TransK<TC extends Base<any>, A> = _TransK<TC, A>;
export function TransK<TC extends Base<any>>(
  TC: TC,
): TransKPartiallyApplied<TC>;
export function TransK<TC extends Base<any>, A>(
  TC: TC,
  value: Kind<TC['_F'], [A]>,
): TransK<TC, A>;
export function TransK<TC extends Base<any>, A>(
  TC: TC,
  value: Kind<TC['_F'], [A]>,
): TransK<TC, A>;
export function TransK(...args: any[]): any {
  return args.length === 1
    ? (value: any) => new _TransK(args[0], value)
    : new _TransK(args[0], args[1]);
}

interface TransKPartiallyApplied<TC extends Base<any>> {
  <A>(value: Kind<TC['_F'], [A]>): TransK<TC, A>;
}
export class _TransK<TC extends Base<any>, A> {
  public constructor(
    public readonly TC: TC,
    public readonly value: Kind<TC['_F'], [A]>,
  ) {}

  // -- Invariant

  public imap<B, TC extends Invariant<any>>(
    this: TransK<TC, A>,
    f: (a: A) => B,
    g: (b: B) => A,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.imap_(this.value, f, g));
  }

  // -- Functor

  public map<B, TC extends Functor<any>>(
    this: TransK<TC, A>,
    f: (a: A) => B,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.map_(this.value, f));
  }

  public tupleLeft<B, TC extends Functor<any>>(
    this: TransK<TC, A>,
    b: B,
  ): TransK<TC, [B, A]> {
    return new _TransK(this.TC, this.TC.tupleLeft_(this.value, b));
  }
  public tupleRight<B, TC extends Functor<any>>(
    this: TransK<TC, A>,
    b: B,
  ): TransK<TC, [A, B]> {
    return new _TransK(this.TC, this.TC.tupleRight_(this.value, b));
  }

  public void<TC extends Functor<any>>(this: TransK<TC, A>): TransK<TC, void> {
    return new _TransK(this.TC, this.TC.void(this.value));
  }

  // -- Contravariant

  public contramap<B, TC extends Contravariant<any>>(
    this: TransK<TC, A>,
    f: (b: B) => A,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.contramap_(this.value, f));
  }

  // -- FunctorFilter

  public mapFilter<B, TC extends FunctorFilter<any>>(
    this: TransK<TC, A>,
    f: (a: A) => Option<B>,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.mapFilter_(this.value, f));
  }

  public collect<B, TC extends FunctorFilter<any>>(
    this: TransK<TC, A>,
    f: (a: A) => Option<B>,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.collect_(this.value, f));
  }

  public filter<B extends A, TC extends FunctorFilter<any>>(
    this: TransK<TC, A>,
    f: (a: A) => a is B,
  ): TransK<TC, B>;
  public filter<TC extends FunctorFilter<any>>(
    this: TransK<TC, A>,
    f: (a: A) => boolean,
  ): TransK<TC, A>;
  public filter<TC extends FunctorFilter<any>>(
    this: TransK<TC, A>,
    f: (a: A) => boolean,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.filter_(this.value, f));
  }

  public filterNot<TC extends FunctorFilter<any>>(
    this: TransK<TC, A>,
    f: (a: A) => boolean,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.filterNot_(this.value, f));
  }

  // -- Apply

  public apF<A, B, TC extends Apply<any>>(
    this: TransK<TC, (a: A) => B>,
    ff: Kind<TC['_F'], [A]>,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.ap_(this.value, ff));
  }
  public ap<A, B, TC extends Apply<any>>(
    this: TransK<TC, (a: A) => B>,
    ff: TransK<TC, A>,
  ): TransK<TC, B> {
    return this.apF(ff.value);
  }

  public map2F<A, B, C, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: Kind<TC['_F'], [B]>,
    f: (a: A, b: B) => C,
  ): TransK<TC, C> {
    return new _TransK(this.TC, this.TC.map2_<A, B>(this.value, that)(f));
  }
  public map2<A, B, C, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: TransK<TC, B>,
    f: (a: A, b: B) => C,
  ): TransK<TC, C> {
    return this.map2F(that.value, f);
  }

  public map2EvalF<A, B, C, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: Eval<Kind<TC['_F'], [B]>>,
    f: (a: A, b: B) => C,
  ): Eval<TransK<TC, C>> {
    return this.TC.map2Eval_<A, B>(
      this.value,
      that,
    )(f).map(fc => new _TransK(this.TC, fc));
  }
  public map2Eval<A, B, C, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: Eval<TransK<TC, B>>,
    f: (a: A, b: B) => C,
  ): Eval<TransK<TC, C>> {
    return this.map2EvalF(
      that.map(t => t.value),
      f,
    );
  }

  public productF<A, B, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: Kind<TC['_F'], [B]>,
  ): TransK<TC, [A, B]> {
    return new _TransK(this.TC, this.TC.product_(this.value, that));
  }
  public product<A, B, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: TransK<TC, B>,
  ): TransK<TC, [A, B]> {
    return this.productF(that.value);
  }

  public productLF<A, B, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: Kind<TC['_F'], [B]>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.productL_(this.value, that));
  }
  public productL<A, B, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: TransK<TC, B>,
  ): TransK<TC, A> {
    return this.productLF(that.value);
  }

  public productRF<A, B, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: Kind<TC['_F'], [B]>,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.productR_(this.value, that));
  }
  public productR<A, B, TC extends Apply<any>>(
    this: TransK<TC, A>,
    that: TransK<TC, B>,
  ): TransK<TC, B> {
    return this.productRF(that.value);
  }

  // -- FlatMap

  public flatMapF<B, TC extends FlatMap<any>>(
    this: TransK<TC, A>,
    f: (a: A) => Kind<TC['_F'], [B]>,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.flatMap_(this.value, f));
  }
  public flatMap<B, TC extends FlatMap<TC['_F']>>(
    this: TransK<TC, A>,
    f: (a: A) => TransK<TC, B>,
  ): TransK<TC, B> {
    return this.flatMapF(a => f(a).value);
  }

  // -- ApplicativeError

  public handleError<TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
    f: (e: TC['_E']) => A,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.handleError_(this.value, f));
  }

  public handleErrorWithF<TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
    f: (e: TC['_E']) => Kind<TC['_F'], [A]>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.handleErrorWith_(this.value, f));
  }
  public handleErrorWith<TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
    f: (e: TC['_E']) => TransK<TC, A>,
  ): TransK<TC, A> {
    return this.handleErrorWithF(e => f(e).value);
  }

  public attempt<TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
  ): TransK<TC, Either<TC['_E'], A>> {
    return new _TransK(this.TC, this.TC.attempt(this.value));
  }

  public redeem<B, TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
    h: (e: TC['_E']) => B,
    f: (a: A) => B,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.redeem_(this.value, h, f));
  }

  public onErrorF<TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
    h: (e: TC['_E']) => Kind<TC['_F'], [void]>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.onError_(this.value, h));
  }
  public onError<TC extends ApplicativeError<any, any>>(
    this: TransK<TC, A>,
    h: (e: TC['_E']) => TransK<TC, void>,
  ): TransK<TC, A> {
    return this.onErrorF(e => h(e).value);
  }

  // -- MonadError

  public redeemWithF<B, TC extends MonadError<any, any>>(
    this: TransK<TC, A>,
    h: (e: TC['_E']) => Kind<TC['_F'], [B]>,
    f: (a: A) => Kind<TC['_F'], [B]>,
  ): TransK<TC, B> {
    return new _TransK(this.TC, this.TC.redeemWith_(this.value, h, f));
  }
  public redeemWith<B, TC extends MonadError<any, any>>(
    this: TransK<TC, A>,
    h: (e: TC['_E']) => TransK<TC, B>,
    f: (a: A) => TransK<TC, B>,
  ): TransK<TC, B> {
    return this.redeemWithF(
      (e: TC['_E']) => h(e).value,
      a => f(a).value,
    );
  }

  public rethrow<TC extends MonadError<any, any>>(
    this: TransK<TC, Either<TC['_E'], A>>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.rethrow(this.value));
  }

  // -- SemigroupK

  public combineKF<TC extends SemigroupK<any>>(
    this: TransK<TC, A>,
    that: Lazy<Kind<TC['_F'], [A]>>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.combineK_(this.value, that));
  }
  public combineK<TC extends SemigroupK<any>>(
    this: TransK<TC, A>,
    that: Lazy<TransK<TC, A>>,
  ): TransK<TC, A> {
    return this.combineKF(() => that().value);
  }

  // -- Alternative

  public orElseF<TC extends Alternative<any>>(
    this: TransK<TC, A>,
    that: Lazy<Kind<TC['_F'], [A]>>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.orElse_(this.value, that));
  }
  public orElse<TC extends Alternative<any>>(
    this: TransK<TC, A>,
    that: Lazy<Kind<TC['_F'], [A]>>,
  ): TransK<TC, A> {
    return new _TransK(this.TC, this.TC.orElse_(this.value, that));
  }

  // -- UnorderedFoldable

  public unorderedFoldMap<M, TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
    M: CommutativeMonoid<M>,
  ): (f: (a: A) => M) => M {
    return f => this.TC.unorderedFoldMap_(M)(this.value, f);
  }
  public unorderedFold<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
    M: CommutativeMonoid<A>,
  ): A {
    return this.TC.unorderedFold(M)(this.value);
  }

  public isEmpty<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
  ): boolean {
    return this.TC.isEmpty(this.value);
  }
  public nonEmpty<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
  ): boolean {
    return this.TC.nonEmpty(this.value);
  }

  public all<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
    p: (a: A) => boolean,
  ): boolean {
    return this.TC.all_(this.value, p);
  }
  public any<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
    p: (a: A) => boolean,
  ): boolean {
    return this.TC.any_(this.value, p);
  }
  public count<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
    p: (a: A) => boolean,
  ): number {
    return this.TC.count_(this.value, p);
  }

  public size<TC extends UnorderedFoldable<any>>(
    this: TransK<TC, A>,
    p: (a: A) => boolean,
  ): number {
    return this.TC.count_(this.value, p);
  }

  // -- Foldable

  public foldMap<M, TC extends Foldable<any>>(
    this: TransK<TC, A>,
    M: Monoid<M>,
  ): (f: (a: A) => M) => M {
    return f => this.TC.foldMap_(M)(this.value, f);
  }

  public foldLeft<B, TC extends Foldable<any>>(
    this: TransK<TC, A>,
    z: B,
    f: (b: B, a: A) => B,
  ): B {
    return this.TC.foldLeft_(this.value, z, f);
  }

  public foldRight<B, TC extends Foldable<any>>(
    this: TransK<TC, A>,
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B> {
    return this.TC.foldRight_(this.value, ez, f);
  }

  public elem<TC extends Foldable<any>>(
    this: TransK<TC, A>,
    idx: number,
  ): Option<A> {
    return this.TC.elem_(this.value, idx);
  }

  // -- UnorderedTraversable

  public unorderedTraverse<G, TC extends UnorderedTraversable<any>>(
    this: TransK<TC, A>,
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Kind<TC['_F'], [B]>]> {
    return f => this.TC.unorderedTraverse_(G)(this.value, f);
  }

  // -- Traversable

  public traverse<G, TC extends Traversable<any>>(
    this: TransK<TC, A>,
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Kind<TC['_F'], [B]>]> {
    return f => this.TC.traverse_(G)(this.value, f);
  }
}
