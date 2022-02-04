import { Eval, Monad } from '@fp4ts/cats-core';
import { List } from '@fp4ts/cats-core/lib/data';
import { add, suite, cycle, configure } from 'benny';

function makeTests(calls: number) {
  const vars = List.range(0, calls).toArray;
  const F = Eval.Monad;

  const loop = (i: number): Eval<void> =>
    i < calls ? Eval.pure(i + 1).flatMap(loop) : Eval.pure(undefined);
  const binds = vars.map(v => F.bindTo(`${v}`, () => Eval.pure({})));

  return [
    add('do-like', () => {
      let res = F.Do;
      for (let i = 0; i < calls; i++) {
        res = binds[i](res);
      }
      res.value;
    }),
    add.only('do-gen', () => {
      const res = Monad.Do(Eval.Monad)(function* (_) {
        for (let i = 0; i < calls; i++) {
          const x = yield* _(Eval.pure(undefined));
        }
        return undefined;
      });
      res.value;
    }),
    add('flatMap', () => {
      loop(0).value;
    }),
  ];
}

suite(
  'Do Notation',
  ...[1000, 10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
