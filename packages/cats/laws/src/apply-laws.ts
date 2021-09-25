import { Apply, Eval } from '@cats4ts/cats-core';
import { AnyK, compose, Kind, pipe } from '@cats4ts/core';
import { FunctorLaws } from './functor-laws';
import { IsEq } from './results';

export class ApplyLaws<
  F extends AnyK,
  T extends Apply<F> = Apply<F>,
> extends FunctorLaws<F, T> {
  public readonly applyComposition = <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(b: B) => C]>,
  ): IsEq<Kind<F, [C]>> => {
    const { F } = this;
    const comp: (g: (b: B) => C) => (f: (a: A) => B) => (a: A) => C = g => f =>
      compose(g, f);

    return pipe(fbc, F.ap(F.ap_(fab, fa)))['<=>'](
      pipe(fbc, F.map(comp), F.ap(fab), F.ap(fa)),
    );
  };

  public readonly map2ProductConsistency = <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    const { F } = this;
    return F.map_(F.product_(fa, fb), ([a, b]) => f(a, b))['<=>'](
      F.map2_(fa, fb)(f),
    );
  };

  public readonly map2EvalConsistency = <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    const { F } = this;
    return F.map2_(fa, fb)(f)['<=>'](F.map2Eval_(fa, Eval.now(fb))(f).value);
  };

  public readonly productLConsistency = <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): IsEq<Kind<F, [A]>> => {
    const { F } = this;
    return F.productL_(fa, fb)['<=>'](F.map2_(fa, fb)((a, _) => a));
  };

  public readonly productRConsistency = <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> => {
    const { F } = this;
    return F.productR_(fa, fb)['<=>'](F.map2_(fa, fb)((_, b) => b));
  };
}
