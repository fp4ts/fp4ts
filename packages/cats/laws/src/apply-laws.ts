import { AnyK, compose, Kind, pipe } from '@cats4ts/core';
import { Apply, Eval } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

import { FunctorLaws } from './functor-laws';

export interface ApplyLaws<F extends AnyK> extends FunctorLaws<F> {
  applyComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(b: B) => C]>,
  ) => IsEq<Kind<F, [C]>>;

  map2ProductConsistency: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ) => IsEq<Kind<F, [C]>>;

  map2EvalConsistency: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ) => IsEq<Kind<F, [C]>>;

  productLConsistency: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => IsEq<Kind<F, [A]>>;

  productRConsistency: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;
}

export const ApplyLaws = <F extends AnyK>(F: Apply<F>): ApplyLaws<F> => ({
  ...FunctorLaws(F),

  applyComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    fab: Kind<F, [(a: A) => B]>,
    fbc: Kind<F, [(b: B) => C]>,
  ): IsEq<Kind<F, [C]>> => {
    const comp: (g: (b: B) => C) => (f: (a: A) => B) => (a: A) => C = g => f =>
      compose(g, f);

    return pipe(fbc, F.ap(F.ap_(fab, fa)))['<=>'](
      pipe(fbc, F.map(comp), F.ap(fab), F.ap(fa)),
    );
  },

  map2ProductConsistency: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    return F.map_(F.product_(fa, fb), ([a, b]) => f(a, b))['<=>'](
      F.map2_(fa, fb)(f),
    );
  },

  map2EvalConsistency: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    return F.map2_(fa, fb)(f)['<=>'](F.map2Eval_(fa, Eval.now(fb))(f).value);
  },

  productLConsistency: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): IsEq<Kind<F, [A]>> => {
    return F.productL_(fa, fb)['<=>'](F.map2_(fa, fb)((a, _) => a));
  },

  productRConsistency: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> => {
    return F.productR_(fa, fb)['<=>'](F.map2_(fa, fb)((_, b) => b));
  },
});
