// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  cached,
  Eval,
  HKT,
  id,
  Kind,
  Lazy,
  lazy,
  tupled,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Eq, Monoid, Semigroup } from '@fp4ts/cats-kernel';

import { Applicative } from '../applicative';
import { Functor } from '../functor';
import { SemigroupK } from '../semigroup-k';
import { Foldable } from '../foldable';
import { Traversable } from '../traversable';
import { EqK } from '../eq-k';
import { ApplicativeError } from '../applicative-error';

import { None, Option, Some } from './option';
import { Either, Left, Right } from './either';
import { List, NonEmptyList } from './collections';
import { Bifunctor } from '../bifunctor';

export type Validation<E, A> = _Validation<E, A>;

abstract class _Validation<out E, out A> {
  private readonly _E!: () => E;
  private readonly _A!: () => A;

  public abstract readonly get: A;
  public getOrDefault<B>(this: Validation<E, B>, defaultValue: () => B): B {
    return this.fold(defaultValue, id);
  }
  public abstract readonly getError: ValidationError<E>;

  public abstract readonly isValid: boolean;
  public abstract readonly isInvalid: boolean;

  public get toOption(): Option<A> {
    return this.fold(() => None, Some);
  }

  public toEither<E2>(this: Validation<E2, A>, S: Semigroup<E2>): Either<E2, A>;
  public toEither(): Either<ValidationError<E>, A>;
  public toEither(S?: Semigroup<any>): Either<any, A> {
    return this.fold(e => Left(S ? e.foldS(S) : e), Right);
  }

  public abstract orElse<E2, B>(
    this: Validation<E2, B>,
    that: () => Validation<E2, B>,
  ): Validation<E2, B>;
  public '<|>'<E2, B>(
    this: Validation<E2, B>,
    that: () => Validation<E2, B>,
  ): Validation<E2, B> {
    return this.orElse(that);
  }

  public abstract map<B>(g: (a: A) => B): Validation<E, B>;
  public abstract mapError<E2>(f: (e: E) => E2): Validation<E2, A>;

  public bimap<E2, B>(f: (e: E) => E2, g: (a: A) => B): Validation<E2, B> {
    return this.mapError(f).map(g);
  }

  public abstract map2<E2, B, C>(
    this: Validation<E2, A>,
    that: Validation<E2, B>,
    f: (a: A, b: B) => C,
  ): Validation<E2, C>;
  public map2Eval<E2, B, C>(
    this: Validation<E2, A>,
    that: Eval<Validation<E2, B>>,
    f: (a: A, b: B) => C,
  ): Eval<Validation<E2, C>> {
    return that.map(that => this.map2(that, f));
  }

  public mapN<E2, BS extends unknown[]>(
    this: Validation<E2, A>,
    ...thats: { [k in keyof BS]: Validation<E2, BS[k]> }
  ): <C>(
    f: (a: A, ...args: { [k in keyof BS]: BS[k] }) => C,
  ) => Validation<E2, C> {
    return Validation.Applicative<E2>().mapN_<A, BS>(this, ...thats);
  }

  public product<E2, B>(
    this: Validation<E2, A>,
    that: Validation<E2, B>,
  ): Validation<E2, [A, B]> {
    return this.map2(that, tupled);
  }

  public abstract andThen<B, E2>(
    this: Validation<E2, A>,
    f: (a: A) => Validation<E2, B>,
  ): Validation<E2, B>;

  public abstract fold<B, C = B>(
    onFailure: (e: ValidationError<E>) => B,
    onSuccess: (a: A) => C,
  ): B | C;

  public traverse<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Validation<E, B>]> {
    return f =>
      this.fold(
        e => G.pure(Validation.Invalid(e)),
        a => G.map_(f(a), Validation.Valid),
      );
  }

  public equals<E2, B>(
    this: Validation<E2, B>,
    EE: Eq<ValidationError<E2>>,
    EB: Eq<B>,
  ): (that: Validation<E2, B>) => boolean {
    return that =>
      this.fold(
        e1 =>
          that.fold(
            e2 => EE.equals(e1, e2),
            () => false,
          ),
        b1 =>
          that.fold(
            () => false,
            b2 => EB.equals(b1, b2),
          ),
      );
  }
}

class _Valid<A> extends _Validation<never, A> {
  public constructor(public readonly get: A) {
    super();
  }

  public get getError(): ValidationError<never> {
    throw new Error('Validation.Valid.getError');
  }

  public readonly isValid: boolean = true;
  public readonly isInvalid: boolean = false;

  public orElse<E2, B>(
    this: Validation<E2, B>,
    that: () => Validation<E2, B>,
  ): Validation<E2, B> {
    return this;
  }

  public map<B>(f: (a: A) => B): Validation<never, B> {
    return new _Valid(f(this.get));
  }

  public mapError<E2>(f: (a: never) => E2): Validation<never, A> {
    return this;
  }

  public map2<E2, B, C>(
    this: Validation<E2, A>,
    that: Validation<E2, B>,
    f: (a: A, b: B) => C,
  ): Validation<E2, C> {
    return that.fold(
      ve => Validation.Invalid(ve),
      b => Validation.Valid(f(this.get, b)),
    );
  }

  public andThen<B, E2>(
    this: Validation<E2, A>,
    f: (a: A) => Validation<E2, B>,
  ): Validation<E2, B> {
    return f(this.get);
  }

  public fold<B, C = B>(
    onFailure: (e: ValidationError<never>) => B,
    onSuccess: (a: A) => C,
  ): B | C {
    return onSuccess(this.get);
  }
}

class _Invalid<E> extends _Validation<E, never> {
  public constructor(public readonly getError: ValidationError<E>) {
    super();
  }

  public get get(): never {
    throw new Error('Validation.Invalid.get');
  }

  public readonly isValid: boolean = false;
  public readonly isInvalid: boolean = true;

  public orElse<E2, B>(
    this: Validation<E2, B>,
    that: () => Validation<E2, B>,
  ): Validation<E2, B> {
    return that().fold(
      ve => Validation.Invalid(this.getError.concat(ve)),
      b => Validation.Valid(b),
    );
  }

  public map<B>(f: (a: never) => B): Validation<E, B> {
    return this;
  }

  public mapError<E2>(f: (a: E) => E2): Validation<E2, never> {
    return Validation.Invalid(this.getError.map(f));
  }

  public map2<E2, B, C>(
    this: Validation<E2, never>,
    that: Validation<E2, B>,
    f: (a: never, b: B) => C,
  ): Validation<E2, C> {
    return that.fold(
      ve => Validation.Invalid(this.getError['<>'](ve)),
      () => this,
    );
  }

  public andThen<B, E2>(
    this: Validation<E2, never>,
    f: (a: never) => Validation<E2, B>,
  ): Validation<E2, B> {
    return this;
  }

  public fold<B, C = B>(
    onFailure: (e: ValidationError<E>) => B,
    onSuccess: (a: never) => C,
  ): B | C {
    return onFailure(this.getError);
  }
}

interface ValidationObj {
  pure<A, E = never>(a: A): Validation<E, A>;
  unit<E = never>(): Validation<E, void>;

  Valid<A, E = never>(a: A): Validation<E, A>;
  Invalid<E, A = never>(ve: ValidationError<E>): Validation<E, A>;
  fail<E, A = never>(e: E): Validation<E, A>;

  tailRecM<S>(
    s: S,
  ): <E, A>(f: (s: S) => Validation<E, Either<S, A>>) => Validation<E, A>;

  fromOption<A, E>(o: Option<A>, onNone: () => E): Validation<E, A>;
  fromEither<A, E>(ea: Either<E, A>): Validation<E, A>;

  // -- Instances

  EqK<E>(E: Eq<ValidationError<E>>): EqK<$<ValidationF, [E]>>;

  Functor<E>(): Functor<$<ValidationF, [E]>>;
  Bifunctor: Bifunctor<ValidationF>;
  SemigroupK<E>(): SemigroupK<$<ValidationF, [E]>>;
  Applicative<E>(): Applicative<$<ValidationF, [E]>>;
  ApplicativeError<E>(): ApplicativeError<
    $<ValidationF, [E]>,
    ValidationError<E>
  >;
  ApplicativeErrorConcat<E>(
    E: Semigroup<E>,
  ): ApplicativeError<$<ValidationF, [E]>, E>;

  Foldable<E>(): Foldable<$<ValidationF, [E]>>;
  Traversable<E>(): Traversable<$<ValidationF, [E]>>;
}
export const Validation: ValidationObj = function () {} as any;

Validation.pure = a => new _Valid(a);
Validation.unit = () => new _Valid(undefined);

Validation.Valid = Validation.pure;
Validation.Invalid = e => new _Invalid(e);
Validation.fail = e => Validation.Invalid(ValidationError(e));

Validation.fromOption = (o, onNone) =>
  o.fold(() => Validation.fail(onNone()), Validation.Valid);
Validation.fromEither = ea => ea.fold(Validation.fail, Validation.Valid);

Validation.tailRecM =
  <S>(s: S) =>
  <E, A>(f: (s: S) => Validation<E, Either<S, A>>): Validation<E, A> => {
    let res: Validation<E, A> | undefined;
    let cur = f(s);
    while (res != null) {
      if (cur.isValid) {
        const ea = cur.get;
        if (ea.isRight) {
          res = Validation.Valid(ea.get);
        } else {
          cur = f(ea.getLeft);
        }
      } else {
        res = new _Invalid(cur.getError);
      }
    }
    return res!;
  };

export type ValidationError<E> =
  | LiftValidationError<E>
  | ConcatValidationError<E>;

export const ValidationError: ValidationErrorObj = function <E>(e: E) {
  return new LiftValidationError(e);
};
ValidationError.Eq = {
  Strict: E => Eq.of({ equals: (l, r) => l.equals(E, r) }),
  Concat: (M, ME) => f => Eq.by(ME, ve => ve.foldMap(M)(f)),
};

abstract class _ValidationError<E> {
  private readonly _E!: () => E;

  public get toNel(): NonEmptyList<E> {
    return this.foldMap(NonEmptyList.SemigroupK.algebra<E>())(
      NonEmptyList.pure,
    );
  }

  public get toList(): List<E> {
    return this.foldMap(List.MonoidK.algebra<E>())(List.singleton);
  }

  public map<E2>(f: (e: E) => E2): ValidationError<E2> {
    const self = this as any as ValidationError<E>;
    switch (self.tag) {
      case 'lift':
        return new LiftValidationError(f(self.error));
      case 'concat':
        return self.lhs.map(f)['<>'](self.rhs.map(f));
    }
  }

  public concat<E2>(
    this: _ValidationError<E2>,
    that: ValidationError<E2>,
  ): ValidationError<E2> {
    return new ConcatValidationError(this as ValidationError<E2>, that);
  }
  public '<>'<E2>(
    this: _ValidationError<E2>,
    that: ValidationError<E2>,
  ): ValidationError<E2> {
    return this.concat(that);
  }

  public foldMap<S>(S: Semigroup<S>): (f: (e: E) => S) => S {
    return f =>
      (function go(self: ValidationError<E>): S {
        switch (self.tag) {
          case 'lift':
            return f(self.error);
          case 'concat':
            return S.combine_(go(self.lhs), go(self.rhs));
        }
      })(this as any as ValidationError<E>);
  }

  public foldS<E2>(this: _ValidationError<E2>, S: Semigroup<E2>): E2 {
    return this.foldMap(S)(id);
  }

  public equals<E>(E: Eq<E>, that: ValidationError<E>): boolean {
    function cmp(l: ValidationError<E>, r: ValidationError<E>): boolean {
      if (l === r) return true;
      switch (l.tag) {
        case 'lift':
          switch (r.tag) {
            case 'lift':
              return E.equals(l.error, r.error);
            default:
              return false;
          }
        case 'concat':
          switch (r.tag) {
            case 'concat':
              return cmp(l.lhs, r.lhs) && cmp(l.rhs, r.rhs);
            default:
              return false;
          }
        default:
          return false;
      }
    }
    return cmp(this as any as ValidationError<E>, that);
  }
}

class LiftValidationError<E> extends _ValidationError<E> {
  public readonly tag = 'lift';
  public constructor(public readonly error: E) {
    super();
  }
}

class ConcatValidationError<E> extends _ValidationError<E> {
  public readonly tag = 'concat';

  public constructor(
    public readonly lhs: ValidationError<E>,
    public readonly rhs: ValidationError<E>,
  ) {
    super();
  }
}

interface ValidationErrorObj {
  <E>(e: E): ValidationError<E>;
  Eq: {
    Strict: <E>(E: Eq<E>) => Eq<ValidationError<E>>;
    Concat: <S>(
      S: Semigroup<S>,
      SE: Eq<S>,
    ) => <E>(f: (e: E) => S) => Eq<ValidationError<E>>;
  };
}

// -- Instances

const validationEqK: <E>(
  E: Eq<ValidationError<E>>,
) => EqK<$<ValidationF, [E]>> = <E>(EE: Eq<ValidationError<E>>) =>
  EqK.of<$<ValidationF, [E]>>({
    liftEq: <A>(EA: Eq<A>) =>
      Eq.of<Validation<E, A>>({ equals: (xs, ys) => xs.equals(EE, EA)(ys) }),
  });

const validationFunctor: <E>() => Functor<$<ValidationF, [E]>> = lazy(<E>() =>
  Functor.of<$<ValidationF, [E]>>({ map_: (fa, f) => fa.map(f) }),
) as <E>() => Functor<$<ValidationF, [E]>>;

const validationBifunctor: Lazy<Bifunctor<ValidationF>> = lazy(() =>
  Bifunctor.of<ValidationF>({ bimap_: (fa, f, g) => fa.bimap(f, g) }),
);

const validationSemigroupK: <E>() => SemigroupK<$<ValidationF, [E]>> = lazy(<
  E,
>() =>
  SemigroupK.of<$<ValidationF, [E]>>({
    combineK_: (fa, fb) => fa['<|>'](() => fb),
  }),
) as <E>() => SemigroupK<$<ValidationF, [E]>>;

const validationApplicative: <E>() => Applicative<$<ValidationF, [E]>> = <
  E,
>() =>
  Applicative.of({
    ...validationFunctor<E>(),
    pure: Validation.pure,
    unit: Validation.unit<E>(),
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
    map2_:
      <A, B>(fa: Validation<E, A>, fb: Validation<E, B>) =>
      <C>(f: (a: A, b: B) => C): Validation<E, C> =>
        fa.map2(fb, f),
    map2Eval_:
      <A, B>(fa: Validation<E, A>, fb: Eval<Validation<E, B>>) =>
      <C>(f: (a: A, b: B) => C): Eval<Validation<E, C>> =>
        fa.map2Eval(fb, f),
  });

const validationApplicativeError: <E>() => ApplicativeError<
  $<ValidationF, [E]>,
  ValidationError<E>
> = lazy(() =>
  ApplicativeError.of({
    ...validationApplicative(),
    throwError: e => new _Invalid(e),
    handleErrorWith_: (fa, f) => fa.fold(f, Validation.Valid),
  }),
);

const validationApplicativeErrorConcat: <E>(
  E: Semigroup<E>,
) => ApplicativeError<$<ValidationF, [E]>, E> = cached(<E>(E: Semigroup<E>) =>
  ApplicativeError.of<$<ValidationF, [E]>, E>({
    ...validationApplicative<E>(),
    throwError: <A>(e: E) => Validation.fail<E, A>(e),
    handleErrorWith_: (fa, f) =>
      fa.fold(
        e => f(e.foldS(E)),
        a => Validation.Valid(a),
      ),
  }),
);

const validationFoldable: <E>() => Foldable<$<ValidationF, [E]>> = lazy(() =>
  Foldable.of({
    foldMap_:
      <M>(M: Monoid<M>) =>
      (fa, f) =>
        fa.fold(() => M.empty, f),
    foldLeft_: (fa, z, f) =>
      fa.fold(
        () => z,
        a => f(z, a),
      ),
    foldRight_: (fa, ez, f) =>
      Eval.defer(() =>
        fa.fold(
          () => ez,
          a => f(a, ez),
        ),
      ),
  }),
);

const validationTraversable: <E>() => Traversable<$<ValidationF, [E]>> = <
  E,
>() =>
  Traversable.of<$<ValidationF, [E]>>({
    ...validationFunctor<E>(),
    ...validationFoldable<E>(),
    traverse_: (<G>(G: Applicative<G>) =>
      <A, B>(fa: Validation<E, A>, f: (a: A) => Kind<G, [B]>) =>
        fa.traverse(G)(f)) as Traversable<$<ValidationF, [E]>>['traverse_'],
  });

Validation.EqK = validationEqK;
Validation.Functor = validationFunctor;
Object.defineProperty(Validation, 'Bifunctor', {
  get() {
    return validationBifunctor();
  },
});
Validation.SemigroupK = validationSemigroupK;
Validation.Applicative = validationApplicative;
Validation.ApplicativeError = validationApplicativeError;
Validation.ApplicativeErrorConcat = validationApplicativeErrorConcat;
Validation.Foldable = validationFoldable;
Validation.Traversable = validationTraversable;

// -- HKT

interface _Validation<E, A> extends HKT<ValidationF, [E, A]> {}

/**
 * @category Type Constructor
 * @category Data
 */
export interface ValidationF extends TyK<[unknown, unknown]> {
  [$type]: Validation<TyVar<this, 0>, TyVar<this, 1>>;
}
