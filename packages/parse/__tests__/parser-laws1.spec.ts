// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { compose, id } from '@fp4ts/core';
import { EvalF, None, Option, Some } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Parser, StringSource } from '@fp4ts/parse-core';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { eq, fp4tsStringParser, mkStringParserArb0 } from './arbitraries';

describe('Parser Laws', () => {
  describe('SemigroupK', () => {
    const F = Parser.MonoidK<StringSource, EvalF>();

    test(
      'associativity',
      forAll(
        fp4tsStringParser(),
        fp4tsStringParser(),
        fp4tsStringParser(),
        fc.string(),
        (a, b, c, s) =>
          eq(a['<|>'](b)['<|>'](c).parse(s), a.orElse(b.orElse(c)).parse(s)) &&
          eq(
            F.combineK_(
              F.combineK_(a, () => b),
              () => c,
            ).parse(s),
            F.combineK_(a, () => F.combineK_(b, () => c)).parse(s),
          ),
      ),
    );
  });

  describe('MonoidK', () => {
    const F = Parser.MonoidK<StringSource, EvalF>();

    test(
      'left identity',
      forAll(
        fp4tsStringParser(),
        fc.string(),
        (fa, s) =>
          eq(fa.orElse(Parser.empty()).parse(s), fa.parse(s)) &&
          eq(F.combineK_(fa, () => F.emptyK()).parse(s), fa.parse(s)),
      ),
    );

    test(
      'right identity',
      forAll(
        fp4tsStringParser(),
        fc.string(),
        (fa, s) =>
          eq(
            Parser.empty<StringSource, EvalF, never>().orElse(fa).parse(s),
            fa.parse(s),
          ) && eq(F.combineK_(F.emptyK(), () => fa).parse(s), fa.parse(s)),
      ),
    );
  });

  describe('Functor', () => {
    test(
      'covariant identity',
      forAll(fp4tsStringParser(), fc.string(), (p, s) =>
        eq(p.map(id).parse(s), p.parse(s)),
      ),
    );

    test(
      'covariant composition',
      forAll(
        fp4tsStringParser(),
        fc.func<[string], string>(fc.string()),
        fc.func<[string], string>(fc.string()),
        fc.string(),
        (p, f, g, s) =>
          eq(p.map(f).map(g).parse(s), p.map(compose(g, f)).parse(s)),
      ),
    );

    test(
      'as consistent with map () => x',
      forAll(fp4tsStringParser(), fc.integer(), fc.string(), (fa, x, s) =>
        eq(fa.as(x).parse(s), fa.map(() => x).parse(s)),
      ),
    );
  });

  describe('FunctorFilter', () => {
    const F = Parser.FunctorFilter<StringSource, EvalF>();
    test(
      'mapFilter composition',
      forAll(
        fp4tsStringParser(),
        fc.func<[string], Option<string>>(A.fp4tsOption(fc.string())),
        fc.func<[string], Option<string>>(A.fp4tsOption(fc.string())),
        fc.string(),
        (fa, f, g, s) => {
          const lhs = F.mapFilter_(F.mapFilter_(fa, f), g);
          const rhs = F.mapFilter_(fa, a => f(a).flatMap(g));
          return eq(lhs.parse(s), rhs.parse(s));
        },
      ),
    );

    test(
      'mapFilter map consistency',
      forAll(
        fp4tsStringParser(),
        fc.func<[string], string>(fc.string()),
        fc.string(),
        (fa, f, s) =>
          eq(
            F.mapFilter_(fa, a => Some(f(a))).parse(s),
            F.map_(fa, f).parse(s),
          ),
      ),
    );

    test(
      'collect consistent with mapFilter',
      forAll(
        fp4tsStringParser(),
        fc.func<[string], Option<string>>(A.fp4tsOption(fc.string())),
        fc.string(),
        (fa, f, s) =>
          eq(F.collect_(fa, f).parse(s), F.mapFilter_(fa, f).parse(s)),
      ),
    );

    test(
      'flattenOption consistent with mapFilter',
      forAll(
        mkStringParserArb0(A.fp4tsOption(fc.string())),
        fc.string(),
        (ffa, s) =>
          eq(F.flattenOption(ffa).parse(s), F.mapFilter_(ffa, id).parse(s)),
      ),
    );

    test(
      'filter consistent with mapFilter',
      forAll(
        fp4tsStringParser(),
        fc.func<[string], boolean>(fc.boolean()),
        fc.string(),
        (fa, p, s) =>
          eq(
            F.filter_(fa, p).parse(s),
            F.mapFilter_(fa, a => (p(a) ? Some(a) : None)).parse(s),
          ),
      ),
    );

    test(
      'filterNot consistent with filter',
      forAll(
        fp4tsStringParser(),
        fc.func<[string], boolean>(fc.boolean()),
        fc.string(),
        (fa, p, s) =>
          eq(F.filterNot_(fa, p).parse(s), F.filter_(fa, a => !p(a)).parse(s)),
      ),
    );
  });
});
