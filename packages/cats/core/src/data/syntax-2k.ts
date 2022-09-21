import { Base, Kind } from '@fp4ts/core';
import {
  Arrow,
  ArrowChoice,
  Choice,
  Compose,
  Profunctor,
  Strong,
} from '../arrow';
import { Bifunctor } from '../bifunctor';
import { Either } from './either';

export type Syntax2K<TC extends Base<any>, A, B> = _Syntax2K<TC, A, B>;

export class _Syntax2K<TC extends Base<any>, A, B> {
  public constructor(
    public readonly TC: TC,
    public readonly value: Kind<TC['_F'], [A, B]>,
  ) {}

  // -- Bifunctor

  public bimap<C, D, TC extends Bifunctor<any>>(
    this: Syntax2K<TC, A, B>,
    f: (a: A) => C,
    g: (b: B) => D,
  ): _Syntax2K<TC, C, D> {
    return new _Syntax2K(this.TC, this.TC.bimap_(this.value, f, g));
  }

  public map<D, TC extends Bifunctor<any>>(
    this: Syntax2K<TC, A, B>,
    g: (a: B) => D,
  ): _Syntax2K<TC, A, D> {
    return new _Syntax2K(this.TC, this.TC.map_(this.value, g));
  }
  public leftMap<C, TC extends Bifunctor<any>>(
    this: Syntax2K<TC, A, B>,
    f: (a: A) => C,
  ): _Syntax2K<TC, C, B> {
    return new _Syntax2K(this.TC, this.TC.leftMap_(this.value, f));
  }

  // -- Profunctor

  public dimap<C, D, TC extends Profunctor<any>>(
    this: Syntax2K<TC, A, B>,
    f: (c: C) => A,
    g: (b: B) => D,
  ): Syntax2K<TC, C, D> {
    return new _Syntax2K(this.TC, this.TC.dimap_(this.value, f, g));
  }
  public lmap<C, TC extends Profunctor<any>>(
    this: Syntax2K<TC, A, B>,
    f: (c: C) => A,
  ): Syntax2K<TC, C, B> {
    return new _Syntax2K(this.TC, this.TC.lmap_(this.value, f));
  }
  public rmap<D, TC extends Profunctor<any>>(
    this: Syntax2K<TC, A, B>,
    g: (b: B) => D,
  ): Syntax2K<TC, A, D> {
    return new _Syntax2K(this.TC, this.TC.rmap_(this.value, g));
  }

  // -- Strong

  public first<TC extends Strong<any>>(
    this: Syntax2K<TC, A, B>,
  ): <C>() => Syntax2K<TC, [A, C], [B, C]> {
    return <C>() => new _Syntax2K(this.TC, this.TC.first<C>()(this.value));
  }
  public second<TC extends Strong<any>>(
    this: Syntax2K<TC, A, B>,
  ): <C>() => Syntax2K<TC, [C, A], [C, B]> {
    return <C>() => new _Syntax2K(this.TC, this.TC.second<C>()(this.value));
  }

  // -- Compose

  public composeF<AA, TC extends Compose<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [AA, A]>,
  ): Syntax2K<TC, AA, B> {
    return new _Syntax2K(this.TC, this.TC.compose_(this.value, that));
  }
  public compose<AA, TC extends Compose<any>>(
    this: Syntax2K<TC, A, B>,
    that: Syntax2K<TC, AA, A>,
  ): Syntax2K<TC, AA, B> {
    return this.composeF(that.value);
  }
  public '<<<'<AA, TC extends Compose<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [AA, A]> | Syntax2K<TC, AA, A>,
  ): Syntax2K<TC, AA, B> {
    return that instanceof _Syntax2K ? this.compose(that) : this.composeF(that);
  }

  public andThenF<C, TC extends Compose<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [B, C]>,
  ): Syntax2K<TC, A, C> {
    return new _Syntax2K(this.TC, this.TC.andThen_(this.value, that));
  }
  public andThen<C, TC extends Compose<any>>(
    this: Syntax2K<TC, A, B>,
    that: Syntax2K<TC, B, C>,
  ): Syntax2K<TC, A, C> {
    return this.andThenF(that.value);
  }
  public '>>>'<C, TC extends Compose<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [B, C]> | Syntax2K<TC, B, C>,
  ): Syntax2K<TC, A, C> {
    return that instanceof _Syntax2K ? this.andThen(that) : this.andThenF(that);
  }

  // -- Choice

  public choiceF<C, TC extends Choice<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [C, B]>,
  ): Syntax2K<TC, Either<A, C>, B> {
    return new _Syntax2K(this.TC, this.TC.choice(this.value, that));
  }
  public choice<C, TC extends Choice<any>>(
    this: Syntax2K<TC, A, B>,
    that: Syntax2K<TC, C, B>,
  ): Syntax2K<TC, Either<A, C>, B> {
    return this.choiceF(that.value);
  }

  // -- Arrow

  public splitF<C, D, TC extends Arrow<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [C, D]>,
  ): Syntax2K<TC, [A, C], [B, D]> {
    return new _Syntax2K(this.TC, this.TC.split_(this.value, that));
  }
  public split<C, D, TC extends Arrow<any>>(
    this: Syntax2K<TC, A, B>,
    that: Syntax2K<TC, C, D>,
  ): Syntax2K<TC, [A, C], [B, D]> {
    return this.splitF(that.value);
  }
  public '***'<C, D, TC extends Arrow<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [C, D]> | Syntax2K<TC, C, D>,
  ): Syntax2K<TC, [A, C], [B, D]> {
    return that instanceof _Syntax2K ? this.split(that) : this.splitF(that);
  }

  public mergeF<C, TC extends Arrow<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [A, C]>,
  ): Syntax2K<TC, A, [B, C]> {
    return new _Syntax2K(this.TC, this.TC.merge_(this.value, that));
  }
  public merge<C, TC extends Arrow<any>>(
    this: Syntax2K<TC, A, B>,
    that: Syntax2K<TC, A, C>,
  ): Syntax2K<TC, A, [B, C]> {
    return this.mergeF(that.value);
  }
  public '&&&'<C, TC extends Arrow<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [A, C]> | Syntax2K<TC, A, C>,
  ): Syntax2K<TC, A, [B, C]> {
    return that instanceof _Syntax2K ? this.merge(that) : this.mergeF(that);
  }

  // -- ArrowChoice

  public chooseF<C, D, TC extends ArrowChoice<any>>(
    this: Syntax2K<TC, A, B>,
    that: Kind<TC['_F'], [C, D]>,
  ): Syntax2K<TC, Either<A, C>, Either<B, D>> {
    return new _Syntax2K(this.TC, this.TC.choose(this.value, that));
  }
  public choose<C, D, TC extends ArrowChoice<any>>(
    this: Syntax2K<TC, A, B>,
    that: Syntax2K<TC, C, D>,
  ): Syntax2K<TC, Either<A, C>, Either<B, D>> {
    return this.chooseF(that.value);
  }

  public left<TC extends ArrowChoice<any>>(
    this: Syntax2K<TC, A, B>,
  ): <C>() => Syntax2K<TC, Either<A, C>, Either<B, C>> {
    return <C>() => new _Syntax2K(this.TC, this.TC.left<C>()(this.value));
  }
  public right<TC extends ArrowChoice<any>>(
    this: Syntax2K<TC, A, B>,
  ): <C>() => Syntax2K<TC, Either<C, A>, Either<C, B>> {
    return <C>() => new _Syntax2K(this.TC, this.TC.right<C>()(this.value));
  }
}
