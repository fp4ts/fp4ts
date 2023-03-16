import { Eval, Kind } from '@fp4ts/core';
import { Identity, Kleisli, Monad, Option } from '@fp4ts/cats';
import { View } from '@fp4ts/collections';

const go = <F>(F: Monad<F>) =>
  function go(i: number): Eval<Kind<F, [number]>> {
    return i >= 5_000_000
      ? Eval.now(F.pure(0))
      : F.map2Eval_(
          F.unit,
          Eval.defer(() => go(i + 1)),
          (_, n) => n + 1,
        );
  };

const start = Date.now();
console.log(go(Kleisli.Monad(Option.Monad))(0).value(null));
console.log(Date.now() - start);
