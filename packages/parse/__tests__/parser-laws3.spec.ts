// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { $, pipe } from '@fp4ts/core';
import { EvalF, IdentityF, Kleisli } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Parser, ParserTF, StringSource } from '@fp4ts/parse-core';
import { eq, fp4tsStringParser0, mkStringParserArb0 } from './arbitraries';

describe('Parser Laws', () => {
  fc.configureGlobal({ numRuns: 50 });

  describe('FlatMap', () => {
    const F = Parser.Monad<StringSource, EvalF>();

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
          const C = Kleisli.Compose(F);

          const l = C.andThen_(C.andThen_(f, g), h)(a).parse(s);
          const r = C.andThen_(f, C.andThen_(g, h))(a).parse(s);

          return eq(l, r);
        },
      ),
    );
  });

  describe('Monad', () => {
    const F = Parser.Monad<StringSource, EvalF>();

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
            Parser.succeed<StringSource, EvalF, string>(a).flatMap(f).parse(s),
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
          const C = Kleisli.Compose(F);
          type F = $<ParserTF, [StringSource, EvalF]>;

          return eq(
            C.andThen_(F.pure as Kleisli<F, number, number>, f)(a).parse(s),
            f(a).parse(s),
          );
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
          const C = Kleisli.Compose(F);
          type F = $<ParserTF, [StringSource, IdentityF]>;

          return eq(C.andThen_(f, F.pure)(a).parse(s), f(a).parse(s));
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
