import { Kind } from '@cats4ts/core';
import { Eval, Foldable, Monoid } from '@cats4ts/cats-core';

import { UnorderedFoldableLaws } from './unordered-foldable-laws';
import { IsEq } from '@cats4ts/cats-test-kit';

export const FoldableLaws = <F>(F: Foldable<F>): FoldableLaws<F> => ({
  ...UnorderedFoldableLaws(F),

  foldRightLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.foldRight_(fa, Eval.now('empty'), () => {
      i += 1;
      return Eval.now('not empty');
    }).value;
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  leftFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A) => B): IsEq<B> =>
      new IsEq(
        F.foldMap_(B)(fa, f),
        F.foldLeft_(fa, B.empty, (b, a) => B.combine_(b, () => f(a))),
      ),

  rightFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A) => B): IsEq<B> => {
      const M = Eval.Monoid(B);

      return new IsEq(
        F.foldMap_(B)(fa, f),
        F.foldRight_(fa, M.empty, (a, b) =>
          M.combine_(
            Eval.later(() => f(a)),
            () => b,
          ),
        ).value,
      );
    },
});

export interface FoldableLaws<F> extends UnorderedFoldableLaws<F> {
  foldRightLazy: <A>(fa: Kind<F, [A]>) => boolean;

  leftFoldConsistentWithFoldMap: <B>(
    B: Monoid<B>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => B) => IsEq<B>;

  rightFoldConsistentWithFoldMap: <B>(
    B: Monoid<B>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => B) => IsEq<B>;
}
