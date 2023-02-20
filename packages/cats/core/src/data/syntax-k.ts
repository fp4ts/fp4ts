// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Base, Kind, Lazy } from '@fp4ts/core';
import { CommutativeMonoid, Monoid } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { ApplicativeError } from '../applicative-error';
import { Apply } from '../apply';
import { Contravariant } from '../contravariant';
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

export type SyntaxK<TC extends Base<any>, A> = _SyntaxK<TC, A>;
export function SyntaxK<TC extends Base<any>>(
  TC: TC,
): TransKPartiallyApplied<TC>;
export function SyntaxK<TC extends Base<any>, A>(
  TC: TC,
  value: Kind<TC['_F'], [A]>,
): SyntaxK<TC, A>;
export function SyntaxK<TC extends Base<any>, A>(
  TC: TC,
  value: Kind<TC['_F'], [A]>,
): SyntaxK<TC, A>;
export function SyntaxK(...args: any[]): any {
  return args.length === 1
    ? (value: any) => new _SyntaxK(args[0], value)
    : new _SyntaxK(args[0], args[1]);
}

interface TransKPartiallyApplied<TC extends Base<any>> {
  <A>(value: Kind<TC['_F'], [A]>): SyntaxK<TC, A>;
}
export class _SyntaxK<TC extends Base<any>, A> {
  public constructor(
    public readonly TC: TC,
    public readonly value: Kind<TC['_F'], [A]>,
  ) {}

  // -- Invariant

  public imap<B>(
    this: SyntaxK<TC & Invariant<TC['_F']>, A>,
    f: (a: A) => B,
    g: (b: B) => A,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.imap_(this.value, f, g));
  }

  // -- Functor

  public map<B>(
    this: SyntaxK<TC & Functor<TC['_F']>, A>,
    f: (a: A) => B,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.map_(this.value, f));
  }

  public tupleLeft<B>(
    this: SyntaxK<TC & Functor<TC['_F']>, A>,
    b: B,
  ): SyntaxK<TC, [B, A]> {
    return new _SyntaxK(this.TC, this.TC.tupleLeft_(this.value, b));
  }
  public tupleRight<B>(
    this: SyntaxK<TC & Functor<TC['_F']>, A>,
    b: B,
  ): SyntaxK<TC, [A, B]> {
    return new _SyntaxK(this.TC, this.TC.tupleRight_(this.value, b));
  }

  public void(this: SyntaxK<TC & Functor<TC['_F']>, A>): SyntaxK<TC, void> {
    return new _SyntaxK(this.TC, this.TC.void(this.value));
  }

  // -- Contravariant

  public contramap<B>(
    this: SyntaxK<TC & Contravariant<TC['_F']>, A>,
    f: (b: B) => A,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.contramap_(this.value, f));
  }

  // -- FunctorFilter

  public mapFilter<B>(
    this: SyntaxK<TC & FunctorFilter<TC['_F']>, A>,
    f: (a: A) => Option<B>,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.mapFilter_(this.value, f));
  }

  public collect<B>(
    this: SyntaxK<TC & FunctorFilter<TC['_F']>, A>,
    f: (a: A) => Option<B>,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.collect_(this.value, f));
  }

  public filter<B extends A>(
    this: SyntaxK<TC & FunctorFilter<TC['_F']>, A>,
    f: (a: A) => a is B,
  ): SyntaxK<TC, B>;
  public filter(
    this: SyntaxK<TC & FunctorFilter<TC['_F']>, A>,
    f: (a: A) => boolean,
  ): SyntaxK<TC, A>;
  public filter(
    this: SyntaxK<TC & FunctorFilter<TC['_F']>, A>,
    f: (a: A) => boolean,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.filter_(this.value, f));
  }

  public filterNot(
    this: SyntaxK<TC & FunctorFilter<TC['_F']>, A>,
    f: (a: A) => boolean,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.filterNot_(this.value, f));
  }

  // -- Apply

  public apF<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, (a: A) => B>,
    ff: Kind<TC['_F'], [A]>,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.ap_(this.value, ff));
  }
  public ap<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, (a: A) => B>,
    ff: SyntaxK<TC, A>,
  ): SyntaxK<TC, B> {
    return this.apF(ff.value);
  }
  public '<*>'<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, (a: A) => B>,
    ff: SyntaxK<TC & Apply<TC['_F']>, A> | Kind<TC['_F'], [A]>,
  ): SyntaxK<TC, B> {
    return ff instanceof _SyntaxK ? this.ap(ff) : this.apF(ff);
  }

  public map2F<A, B, C>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: Kind<TC['_F'], [B]>,
    f: (a: A, b: B) => C,
  ): SyntaxK<TC, C> {
    return new _SyntaxK(this.TC, this.TC.map2_<A, B, C>(this.value, that, f));
  }
  public map2<A, B, C>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: SyntaxK<TC & Apply<TC['_F']>, B>,
    f: (a: A, b: B) => C,
  ): SyntaxK<TC, C> {
    return this.map2F(that.value, f);
  }

  public map2EvalF<A, B, C>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: Eval<Kind<TC['_F'], [B]>>,
    f: (a: A, b: B) => C,
  ): Eval<SyntaxK<TC, C>> {
    return this.TC.map2Eval_<A, B, C>(this.value, that, f).map(
      fc => new _SyntaxK(this.TC, fc),
    );
  }
  public map2Eval<A, B, C>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: Eval<SyntaxK<TC & Apply<TC['_F']>, B>>,
    f: (a: A, b: B) => C,
  ): Eval<SyntaxK<TC, C>> {
    return this.map2EvalF(
      that.map(t => t.value),
      f,
    );
  }

  public productF<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, [A, B]> {
    return new _SyntaxK(this.TC, this.TC.product_(this.value, that));
  }
  public product<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: SyntaxK<TC & Apply<TC['_F']>, B>,
  ): SyntaxK<TC, [A, B]> {
    return this.productF(that.value);
  }

  public productLF<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.productL_(this.value, that));
  }
  public productL<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: SyntaxK<TC & Apply<TC['_F']>, B>,
  ): SyntaxK<TC, A> {
    return this.productLF(that.value);
  }
  public '<*'<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: SyntaxK<TC & Apply<TC['_F']>, B> | Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, A> {
    return that instanceof _SyntaxK
      ? this.productL(that)
      : this.productLF(that);
  }

  public productRF<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.productR_(this.value, that));
  }
  public productR<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: SyntaxK<TC & Apply<TC['_F']>, B>,
  ): SyntaxK<TC, B> {
    return this.productRF(that.value);
  }
  public '*>'<A, B>(
    this: SyntaxK<TC & Apply<TC['_F']>, A>,
    that: SyntaxK<TC & Apply<TC['_F']>, B> | Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, B> {
    return that instanceof _SyntaxK
      ? this.productR(that)
      : this.productRF(that);
  }

  // -- FlatMap

  public flatMapF<B>(
    this: SyntaxK<TC & FlatMap<TC['_F']>, A>,
    f: (a: A) => Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.flatMap_(this.value, f));
  }
  public flatMap<B>(
    this: SyntaxK<TC & FlatMap<TC['_F']>, A>,
    f: (a: A) => SyntaxK<TC & FlatMap<TC['_F']>, B>,
  ): SyntaxK<TC, B> {
    return this.flatMapF(a => f(a).value);
  }
  public '>>='<B>(
    this: SyntaxK<TC & FlatMap<TC['_F']>, A>,
    f: (a: A) => SyntaxK<TC & FlatMap<TC['_F']>, B> | Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, B> {
    return this.flatMapF(a => {
      const x = f(a);
      return x instanceof _SyntaxK ? x.value : x;
    });
  }

  // -- ApplicativeError

  public handleError<TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
    f: (e: TC['_E']) => A,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.handleError_(this.value, f));
  }

  public handleErrorWithF<TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
    f: (e: TC['_E']) => Kind<TC['_F'], [A]>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.handleErrorWith_(this.value, f));
  }
  public handleErrorWith<TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
    f: (e: TC['_E']) => SyntaxK<TC, A>,
  ): SyntaxK<TC, A> {
    return this.handleErrorWithF(e => f(e).value);
  }

  public attempt<TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
  ): SyntaxK<TC, Either<TC['_E'], A>> {
    return new _SyntaxK(this.TC, this.TC.attempt(this.value));
  }

  public redeem<B, TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
    h: (e: TC['_E']) => B,
    f: (a: A) => B,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.redeem_(this.value, h, f));
  }

  public onErrorF<TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
    h: (e: TC['_E']) => Kind<TC['_F'], [void]>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.onError_(this.value, h));
  }
  public onError<TC extends ApplicativeError<any, any>>(
    this: SyntaxK<TC, A>,
    h: (e: TC['_E']) => SyntaxK<TC, void>,
  ): SyntaxK<TC, A> {
    return this.onErrorF(e => h(e).value);
  }

  // -- MonadError

  public redeemWithF<B, TC extends MonadError<any, any>>(
    this: SyntaxK<TC, A>,
    h: (e: TC['_E']) => Kind<TC['_F'], [B]>,
    f: (a: A) => Kind<TC['_F'], [B]>,
  ): SyntaxK<TC, B> {
    return new _SyntaxK(this.TC, this.TC.redeemWith_(this.value, h, f));
  }
  public redeemWith<B, TC extends MonadError<any, any>>(
    this: SyntaxK<TC, A>,
    h: (e: TC['_E']) => SyntaxK<TC, B>,
    f: (a: A) => SyntaxK<TC, B>,
  ): SyntaxK<TC, B> {
    return this.redeemWithF(
      (e: TC['_E']) => h(e).value,
      a => f(a).value,
    );
  }

  public rethrow<TC extends MonadError<any, any>>(
    this: SyntaxK<TC, Either<TC['_E'], A>>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.rethrow(this.value));
  }

  // -- SemigroupK

  public combineKF<TC extends SemigroupK<any>>(
    this: SyntaxK<TC, A>,
    that: Lazy<Kind<TC['_F'], [A]>>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.combineK_(this.value, that));
  }
  public combineK<TC extends SemigroupK<any>>(
    this: SyntaxK<TC, A>,
    that: Lazy<SyntaxK<TC, A>>,
  ): SyntaxK<TC, A> {
    return this.combineKF(() => that().value);
  }

  // -- Alternative

  public orElseF<TC extends Alternative<any>>(
    this: SyntaxK<TC, A>,
    that: Lazy<Kind<TC['_F'], [A]>>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(this.TC, this.TC.orElse_(this.value, that));
  }
  public orElse<TC extends Alternative<any>>(
    this: SyntaxK<TC, A>,
    that: Lazy<SyntaxK<TC, A>>,
  ): SyntaxK<TC, A> {
    return new _SyntaxK(
      this.TC,
      this.TC.orElse_(this.value, () => that().value),
    );
  }

  // -- UnorderedFoldable

  public unorderedFoldMap<M, TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
    M: CommutativeMonoid<M>,
  ): (f: (a: A) => M) => M {
    return f => this.TC.unorderedFoldMap_(M)(this.value, f);
  }
  public unorderedFold<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
    M: CommutativeMonoid<A>,
  ): A {
    return this.TC.unorderedFold(M)(this.value);
  }

  public isEmpty<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
  ): boolean {
    return this.TC.isEmpty(this.value);
  }
  public nonEmpty<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
  ): boolean {
    return this.TC.nonEmpty(this.value);
  }

  public all<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
    p: (a: A) => boolean,
  ): boolean {
    return this.TC.all_(this.value, p);
  }
  public any<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
    p: (a: A) => boolean,
  ): boolean {
    return this.TC.any_(this.value, p);
  }
  public count<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
    p: (a: A) => boolean,
  ): number {
    return this.TC.count_(this.value, p);
  }

  public size<TC extends UnorderedFoldable<any>>(
    this: SyntaxK<TC, A>,
    p: (a: A) => boolean,
  ): number {
    return this.TC.count_(this.value, p);
  }

  // -- Foldable

  public foldMap<M, TC extends Foldable<any>>(
    this: SyntaxK<TC, A>,
    M: Monoid<M>,
  ): (f: (a: A) => M) => M {
    return f => this.TC.foldMap_(M)(this.value, f);
  }

  public foldLeft<B, TC extends Foldable<any>>(
    this: SyntaxK<TC, A>,
    z: B,
    f: (b: B, a: A) => B,
  ): B {
    return this.TC.foldLeft_(this.value, z, f);
  }

  public foldRight<B, TC extends Foldable<any>>(
    this: SyntaxK<TC, A>,
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B> {
    return this.TC.foldRight_(this.value, ez, f);
  }

  public elem<TC extends Foldable<any>>(
    this: SyntaxK<TC, A>,
    idx: number,
  ): Option<A> {
    return this.TC.elem_(this.value, idx);
  }

  // -- UnorderedTraversable

  public unorderedTraverse<G, TC extends UnorderedTraversable<any>>(
    this: SyntaxK<TC, A>,
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Kind<TC['_F'], [B]>]> {
    return f => this.TC.unorderedTraverse_(G)(this.value, f);
  }

  // -- Traversable

  public traverse<G, TC extends Traversable<any>>(
    this: SyntaxK<TC, A>,
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Kind<TC['_F'], [B]>]> {
    return f => this.TC.traverse_(G)(this.value, f);
  }
}
