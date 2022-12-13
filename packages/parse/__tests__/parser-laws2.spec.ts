// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { compose, pipe } from '@fp4ts/core';
import { Eval, EvalF } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Parser, StringSource } from '@fp4ts/parse-core';
import { eq, fp4tsStringParser0, mkStringParserArb0 } from './arbitraries';

describe('Parser Laws', () => {
  fc.configureGlobal({ numRuns: 50 });

  describe('Apply', () => {
    const F = Parser.Monad<StringSource, EvalF>();

    test(
      'apply composition',
      forAll(
        fp4tsStringParser0(),
        mkStringParserArb0(fc.func<[string], number>(fc.integer())),
        mkStringParserArb0(fc.func<[number], string>(fc.string())),
        fc.string(),
        (fa, fab, fbc, s) => {
          const comp: (
            g: (b: number) => string,
          ) => (f: (a: string) => number) => (a: string) => string = g => f =>
            compose(g, f);

          return eq(
            pipe(fbc, F.ap(F.ap_(fab, fa))).parse(s),
            pipe(fbc, F.map(comp), F.ap(fab), F.ap(fa)).parse(s),
          );
        },
      ),
    );

    test(
      'map2 product consistency',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.func<[string, string], number>(fc.integer()),
        fc.string(),
        (fa, fb, f, s) =>
          eq(
            F.map_(F.product_(fa, fb), ([a, b]) => f(a, b)).parse(s),
            F.map2_(fa, fb)(f).parse(s),
          ),
      ),
    );

    test(
      'map2Eval consistency',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.func<[string, string], number>(fc.integer()),
        fc.string(),
        (fa, fb, f, s) =>
          eq(
            F.map2_(fa, fb)(f).parse(s),
            F.map2Eval_(fa, Eval.now(fb))(f).value.parse(s),
          ),
      ),
    );

    test(
      'productL consistency',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.string(),
        (fa, fb, s) =>
          eq(fa['<*'](fb).parse(s), F.productL_(fa, fb).parse(s)) &&
          eq(
            F.productL_(fa, fb).parse(s),
            F.map2_(fa, fb)((a, _) => a).parse(s),
          ),
      ),
    );

    test(
      'productR consistency',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.string(),
        (fa, fb, s) =>
          eq(fa['*>'](fb).parse(s), F.productR_(fa, fb).parse(s)) &&
          eq(
            F.productR_(fa, fb).parse(s),
            F.map2_(fa, fb)((_, b) => b).parse(s),
          ),
      ),
    );
  });

  describe('Applicative', () => {
    const F = Parser.Monad<StringSource, EvalF>();

    test(
      'applicative identity',
      forAll(
        fp4tsStringParser0(),
        fc.string(),
        (fa, s) =>
          eq(
            Parser.succeed<StringSource, EvalF, (s: string) => string>(
              (a: string) => a,
            )
              ['<*>'](fa)
              .parse(s),
            fa.parse(s),
          ) &&
          eq(
            pipe(
              F.pure((a: string) => a),
              F.ap(fa),
            ).parse(s),
            fa.parse(s),
          ),
      ),
    );

    test(
      'applicative homomorphism',
      forAll(
        fc.integer(),
        fc.func<[number], string>(fc.string()),
        fc.string(),
        (a, f, s) =>
          eq(pipe(F.pure(f), F.ap(F.pure(a))).parse(s), F.pure(f(a)).parse(s)),
      ),
    );

    test(
      'applicative interchange',
      forAll(
        fc.integer(),
        mkStringParserArb0(fc.func<[number], string>(fc.string())),
        fc.string(),
        (a, ff, s) =>
          eq(ff['<*>'](F.pure(a)).parse(s), F.ap_(ff, F.pure(a)).parse(s)) &&
          eq(
            F.ap_(ff, F.pure(a)).parse(s),
            pipe(
              F.pure((f: (a: number) => string) => f(a)),
              F.ap(ff),
            ).parse(s),
          ),
      ),
    );

    test(
      'applicative map',
      forAll(
        fp4tsStringParser0(),
        fc.func<[string], number>(fc.integer()),
        fc.string(),
        (fa, f, s) =>
          eq(fa.map(f).parse(s), pipe(F.pure(f), F.ap(fa)).parse(s)),
      ),
    );

    test(
      'applicative composition',
      forAll(
        fp4tsStringParser0(),
        mkStringParserArb0(fc.func<[string], number>(fc.integer())),
        mkStringParserArb0(fc.func<[number], boolean>(fc.boolean())),
        fc.string(),
        (fa, fab, fbc, s) => {
          const comp: (
            g: (b: number) => boolean,
          ) => (f: (a: string) => number) => (a: string) => boolean = g => f =>
            compose(g, f);

          return (
            eq(
              Parser.succeed<StringSource, EvalF, typeof comp>(comp)
                ['<*>'](fbc)
                ['<*>'](fab)
                ['<*>'](fa)
                .parse(s),
              pipe(F.pure(comp), F.ap(fbc), F.ap(fab), F.ap(fa)).parse(s),
            ) &&
            eq(
              pipe(F.pure(comp), F.ap(fbc), F.ap(fab), F.ap(fa)).parse(s),
              pipe(fbc, F.ap(F.ap_(fab, fa))).parse(s),
            )
          );
        },
      ),
    );

    test(
      'applicative unit',
      forAll(
        fc.integer(),
        fc.string(),
        (a, s) =>
          eq(
            Parser.unit<StringSource, EvalF>().as(a).parse(s),
            Parser.succeed<StringSource, EvalF, number>(a).parse(s),
          ) && eq(F.map_(F.unit, () => a).parse(s), F.pure(a).parse(s)),
      ),
    );
  });
});
