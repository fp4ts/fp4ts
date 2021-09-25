import { AnyK, compose, Kind, pipe } from '@cats4ts/core';
import { Applicative } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

import { ApplyLaws } from './apply-laws';

export class ApplicativeLaws<
  F extends AnyK,
  T extends Applicative<F> = Applicative<F>,
> extends ApplyLaws<F, T> {
  public readonly applicativeIdentity = <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> => {
    const { F } = this;

    return pipe(
      F.pure((a: A) => a),
      F.ap(fa),
    )['<=>'](fa);
  };

  public readonly applicativeHomomorphism = <A, B>(
    a: A,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> => {
    const { F } = this;

    return pipe(F.pure(f), F.ap(F.pure(a)))['<=>'](F.pure(f(a)));
  };

  public readonly applicativeInterchange = <A, B>(
    a: A,
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> => {
    const { F } = this;

    return F.ap_(ff, F.pure(a))['<=>'](
      pipe(
        F.pure((f: (a: A) => B) => f(a)),
        F.ap(ff),
      ),
    );
  };

  public readonly applicativeMap = <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> => {
    const { F } = this;

    return F.map_(fa, f)['<=>'](pipe(F.pure(f), F.ap(fa)));
  };

  public readonly applicativeComposition = <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(a: B) => C]>,
  ): IsEq<Kind<F, [C]>> => {
    const { F } = this;
    const comp: (g: (b: B) => C) => (f: (a: A) => B) => (a: A) => C = g => f =>
      compose(g, f);

    return pipe(F.pure(comp), F.ap(fbc), F.ap(fab), F.ap(fa))['<=>'](
      pipe(fbc, F.ap(F.ap_(fab, fa))),
    );
  };

  public readonly apProductConsistent = <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> => {
    const { F } = this;

    return F.ap_(ff, fa)['<=>'](
      pipe(
        F.product_(ff, fa),
        F.map(([f, a]) => f(a)),
      ),
    );
  };

  public readonly applicativeUnit = <A>(a: A): IsEq<Kind<F, [A]>> => {
    const { F } = this;

    return F.map_(F.unit, () => a)['<=>'](F.pure(a));
  };
}
