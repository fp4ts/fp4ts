import { Kind } from '@fp4ts/core';
import { Eval, FoldableWithIndex } from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FoldableLaws } from './foldable-laws';

export const FoldableWithIndexLaws = <F, I>(F: FoldableWithIndex<F, I>) => ({
  ...FoldableLaws(F),

  indexedLeftFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): IsEq<B> =>
      new IsEq(
        F.foldMapWithIndex_(B)(fa, f),
        F.foldLeftWithIndex_(fa, B.empty, (b, a, i) =>
          B.combine_(b, () => f(a, i)),
        ),
      ),

  indexedRightFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): IsEq<B> => {
      const M = Eval.Monoid(B);

      return new IsEq(
        F.foldMapWithIndex_(B)(fa, f),
        F.foldRightWithIndex_(fa, M.empty, (a, b, i) =>
          M.combine_(
            Eval.later(() => f(a, i)),
            () => b,
          ),
        ).value,
      );
    },
});
