// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { $, pipe } from '@fp4ts/core';
import { IdentityF, Kleisli } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Parser, ParserTF, StringSource } from '@fp4ts/parse-core';
import { eq, fp4tsStringParser0, mkStringParserArb0 } from './arbitraries';

describe('Parser Laws', () => {
  fc.configureGlobal({ numRuns: 50 });

  describe('FlatMap', () => {
    const F = Parser.Monad<StringSource>();

    test(
      'flatMap associativity',
      forAll(
        fp4tsStringParser0(),
        fc.func<[string], Parser<StringSource, number>>(
          mkStringParserArb0(fc.integer()),
        ),
        fc.func<[number], Parser<StringSource, boolean>>(
          mkStringParserArb0(fc.boolean()),
        ),
        fc.string(),
        (fa, f, g, s) =>
          eq(
            fa.flatMap(f).flatMap(g).parse(s),
            F.flatMap_(fa, a => F.flatMap_(f(a), g)).parse(s),
          ) &&
          eq(
            pipe(fa, F.flatMap(f), F.flatMap(g)).parse(s),
            F.flatMap_(fa, a => F.flatMap_(f(a), g)).parse(s),
          ),
      ),
    );

    test(
      'flatMap consistent apply',
      forAll(
        mkStringParserArb0(fc.func<[string], number>(fc.integer())),
        fp4tsStringParser0(),
        fc.string(),
        (ff, fa, s) =>
          eq(
            F.ap_(ff, fa).parse(s),
            F.flatMap_(ff, f => F.map_(fa, a => f(a))).parse(s),
          ),
      ),
    );

    test(
      'kleisli associativity',
      forAll(
        fc.integer(),
        fc.func<[number], Parser<StringSource, string>>(
          mkStringParserArb0(fc.string()),
        ),
        fc.func<[string], Parser<StringSource, string>>(
          mkStringParserArb0(fc.string()),
        ),
        fc.func<[string], Parser<StringSource, string>>(
          mkStringParserArb0(fc.string()),
        ),
        fc.string(),
        (a, f, g, h, s) => {
          type F = $<ParserTF, [StringSource, IdentityF]>;
          const kf = Kleisli<F, number, string>(f);
          const kg = Kleisli<F, string, string>(g);
          const kh = Kleisli<F, string, string>(h);

          const l = kf['>=>'](F)(kg)['>=>'](F)(kh).run(a).parse(s);
          const r = kf['>=>'](F)(kg['>=>'](F)(kh)).run(a).parse(s);

          return eq(l, r);
        },
      ),
    );
  });

  describe('Monad', () => {
    const F = Parser.Monad<StringSource>();

    test(
      'left identity',
      forAll(
        fc.string(),
        fc.func<[string], Parser<StringSource, number>>(
          mkStringParserArb0(fc.integer()),
        ),
        fc.string(),
        (a, f, s) =>
          eq(
            Parser.succeed<StringSource, string>(a).flatMap(f).parse(s),
            f(a).parse(s),
          ) && eq(pipe(F.pure(a), F.flatMap(f)).parse(s), f(a).parse(s)),
      ),
    );

    test(
      'right identity',
      forAll(
        fp4tsStringParser0(),
        fc.string(),
        (fa, s) =>
          eq(fa.flatMap(Parser.succeed).parse(s), fa.parse(s)) &&
          eq(F.flatMap_(fa, F.pure).parse(s), fa.parse(s)),
      ),
    );

    test(
      'kleisli left identity',
      forAll(
        fc.integer(),
        fc.func<[number], Parser<StringSource, string>>(fp4tsStringParser0()),
        fc.string(),
        (a, f, s) => {
          type F = $<ParserTF, [StringSource, IdentityF]>;
          const kf = Kleisli<F, number, string>(f);
          const kp = Kleisli<F, number, number>(F.pure);

          return eq(kp['>=>'](F)(kf).run(a).parse(s), f(a).parse(s));
        },
      ),
    );

    test(
      'kleisli right identity',
      forAll(
        fc.integer(),
        fc.func<[number], Parser<StringSource, string>>(fp4tsStringParser0()),
        fc.string(),
        (a, f, s) => {
          type F = $<ParserTF, [StringSource, IdentityF]>;
          const kf = Kleisli<F, number, string>(f);
          const kp = Kleisli<F, string, string>(F.pure);

          return eq(kf['>=>'](F)(kp).run(a).parse(s), f(a).parse(s));
        },
      ),
    );

    test(
      'map flatMap coherence',
      forAll(
        fp4tsStringParser0(),
        fc.func<[string], number>(fc.integer()),
        fc.string(),
        (fa, f, s) =>
          eq(
            fa.flatMap(a => Parser.succeed(f(a))).parse(s),
            F.map_(fa, f).parse(s),
          ) &&
          eq(
            F.flatMap_(fa, a => F.pure(f(a))).parse(s),
            F.map_(fa, f).parse(s),
          ),
      ),
    );
  });
});
