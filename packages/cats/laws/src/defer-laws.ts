import { Kind } from '@cats4ts/core';
import { Defer } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

export const DeferLaws = <F>(F: Defer<F>): DeferLaws<F> => ({
  deferIdentity: <A>(ffa: () => Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.defer(() => ffa()),
      ffa(),
    ),

  deferDoesNotEvaluate: <A>(ffa: () => Kind<F, [A]>): IsEq<boolean> => {
    let evaluated = false;
    const deferFA = F.defer(() => {
      evaluated = true;
      return ffa();
    });
    return new IsEq(evaluated, false);
  },

  deferIsStackSafe: <A>(ffa: () => Kind<F, [A]>): IsEq<Kind<F, [A]>> => {
    const loop = (n: number): Kind<F, [A]> =>
      n <= 0 ? F.defer(() => ffa()) : F.defer(() => loop(n - 1));

    return new IsEq(loop(10_000), ffa());
  },

  deferMatchesFix: <A>(ffa: () => Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.defer(() => ffa()),
      F.fix(() => ffa()),
    ),
});

export interface DeferLaws<F> {
  deferIdentity: <A>(ffa: () => Kind<F, [A]>) => IsEq<Kind<F, [A]>>;
  deferDoesNotEvaluate: <A>(ffa: () => Kind<F, [A]>) => IsEq<boolean>;
  deferIsStackSafe: <A>(ffa: () => Kind<F, [A]>) => IsEq<Kind<F, [A]>>;
  deferMatchesFix: <A>(ffa: () => Kind<F, [A]>) => IsEq<Kind<F, [A]>>;
}
