// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Char, Eval, EvalF, tupled } from '@fp4ts/core';
import { Either, Option } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { ParseError, Parser, ParserT, StringSource } from '@fp4ts/parse-core';
import { HasTokenType } from '@fp4ts/parse-kernel';
import { text } from '@fp4ts/parse-text';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

export const eq = (
  l: Eval<Either<ParseError, any>>,
  r: Eval<Either<ParseError, any>>,
): boolean => {
  expect(l.value).toEqual(r.value);
  return true;
};

export const mkStringParserArb0 = <A>(
  arbA: Arbitrary<A>,
): Arbitrary<Parser<StringSource, A>> =>
  fc.tuple(fp4tsStringParser0(), arbA).map(([p, a]) => p.as(a));

export const fp4tsStringParser0 = (): Arbitrary<
  Parser<StringSource, string>
> => {
  const arbA = fc.string();
  type A = string;
  type S = StringSource;
  type F = EvalF;

  const leaf: Arbitrary<Parser<StringSource, A>> = fc.oneof(
    satisfy(),
    oneOf(),
    noneOf(),
    char(),
    letter(),
    digit(),
    alphaNum(),
    space(),
    string(),
    stringF(),
  );
  const leaf0: Arbitrary<Parser<StringSource, A>> = fc.oneof(
    pure<S, F, A>(arbA),
    fail<S, F, A>(),
    empty<S, F, A>(),
    satisfy(),
    char(),
    letter(),
    digit(),
    alphaNum(),
    space(),
    string0(),
    stringF0(),
  );

  const rec: (n: number) => Arbitrary<Parser<StringSource, A>> = fc.memo(
    depth =>
      depth <= 1
        ? leaf
        : fc.oneof(
            leaf,
            defer(rec(depth - 1)),
            filter(rec(depth - 1)),
            collect(rec(depth - 1), arbA),
            map(rec(depth - 1), arbA),
            orElse(rec(depth - 1)),
            fc
              .tuple(
                product(rec(depth - 1), rec(depth - 1)),
                fc.func<[[A, A]], A>(arbA),
              )
              .map(([p, f]) => p.map(f)),
            flatMap(rec(depth - 1), rec(depth - 1)),
            fc
              .tuple(rep1(rec(depth - 1)), fc.func<[List<A>], A>(arbA))
              .map(([p, f]) => p.map(f)),
          ),
  );

  const rec0: (n: number) => Arbitrary<Parser<StringSource, A>> = fc.memo(
    depth =>
      depth <= 1
        ? leaf0
        : fc.oneof(
            leaf0,
            defer(rec0(depth - 1)),
            filter(rec0(depth - 1)),
            collect(rec0(depth - 1), arbA),
            map(rec0(depth - 1), arbA),
            orElse(rec0(depth - 1)),
            fc
              .tuple(
                product(rec0(depth - 1), rec0(depth - 1)),
                fc.func<[[A, A]], A>(arbA),
              )
              .map(([p, f]) => p.map(f)),
            flatMap(rec0(depth - 1), rec(depth - 1)),
            fc
              .tuple(rep(rec(depth - 1)), fc.func<[List<A>], A>(arbA))
              .map(([p, f]) => p.map(f)),
            fc
              .tuple(rep1(rec(depth - 1)), fc.func<[List<A>], A>(arbA))
              .map(([p, f]) => p.map(f)),
          ),
  );
  return rec0(10);
};

export const fp4tsStringParser = (): Arbitrary<
  Parser<StringSource, string>
> => {
  const arbA = fc.string();
  type A = string;

  const leaf: Arbitrary<Parser<StringSource, A>> = fc.oneof(
    satisfy(),
    oneOf(),
    noneOf(),
    char(),
    letter(),
    digit(),
    alphaNum(),
    space(),
    string(),
    stringF(),
  );

  const rec: (n: number) => Arbitrary<Parser<StringSource, A>> = fc.memo(
    depth =>
      depth <= 1
        ? leaf
        : fc.oneof(
            leaf,
            defer(rec(depth - 1)),
            filter(rec(depth - 1)),
            collect(rec(depth - 1), arbA),
            map(rec(depth - 1), arbA),
            orElse(rec(depth - 1)),
            fc
              .tuple(
                product(rec(depth - 1), rec(depth - 1)),
                fc.func<[[A, A]], A>(arbA),
              )
              .map(([p, f]) => p.map(f)),
            flatMap(rec(depth - 1), rec(depth - 1)),
            fc
              .tuple(rep1(rec(depth - 1)), fc.func<[List<A>], A>(arbA))
              .map(([p, f]) => p.map(f)),
          ),
  );
  return rec(10);
};

export const pure = <S, F, A>(
  arbA: Arbitrary<A>,
): Arbitrary<ParserT<S, F, A>> => arbA.map(x => ParserT.succeed(x));

export const fail = <S, F, A>(): Arbitrary<ParserT<S, F, A>> =>
  fc.constant(ParserT.fail('Failed Parser'));

export const unit = <S, F>(): Arbitrary<ParserT<S, F, void>> =>
  fc.constant(ParserT.unit());

export const empty = <S, F, A>(): Arbitrary<ParserT<S, F, A>> =>
  fc.constant(ParserT.empty());

export const defer = <S, F, A>(
  arbP: Arbitrary<ParserT<S, F, A>>,
): Arbitrary<ParserT<S, F, A>> => arbP.map(p => ParserT.defer(() => p));

export const filter = <S, F, A>(
  arbP: Arbitrary<ParserT<S, F, A>>,
): Arbitrary<ParserT<S, F, A>> =>
  fc
    .tuple(arbP, fc.func<[A], boolean>(fc.boolean()))
    .map(([p, f]) => p.filter(f));

export const collect = <S, F, A, B>(
  arbP: Arbitrary<ParserT<S, F, A>>,
  arbB: Arbitrary<B>,
): Arbitrary<ParserT<S, F, B>> =>
  fc
    .tuple(arbP, fc.func<[A], Option<B>>(A.fp4tsOption(arbB)))
    .map(([p, f]) => p.collect(f));

export const map = <S, F, A, B>(
  arbP: Arbitrary<ParserT<S, F, A>>,
  arbB: Arbitrary<B>,
): Arbitrary<ParserT<S, F, B>> =>
  fc
    .tuple(arbP, fc.func<[A], B>(arbB))
    .chain(([p, f]) =>
      fc.oneof(
        fc.constant(p.map(f)),
        fc.constant(ParserT.Functor<S, F>().map_(p, f)),
      ),
    );

export const orElse = <S, F, A>(
  arbP: Arbitrary<ParserT<S, F, A>>,
): Arbitrary<ParserT<S, F, A>> =>
  fc
    .tuple(arbP, arbP)
    .chain(([lhs, rhs]) =>
      fc.oneof(
        fc.constant(lhs.orElse(rhs)),
        fc.constant(ParserT.MonoidK<S, F>().combineK_(lhs, rhs)),
      ),
    );

export const product = <S, F, A, B>(
  arbPA: Arbitrary<ParserT<S, F, A>>,
  arbPB: Arbitrary<ParserT<S, F, B>>,
): Arbitrary<ParserT<S, F, [A, B]>> =>
  fc.tuple(arbPA, arbPB).chain(([l, r]) =>
    fc.oneof(
      fc.constant(l.product(r)),
      fc.constant(ParserT.Monad<S, F>().product_(l, r)),
      fc.constant(ParserT.Monad<S, F>().map2_(l, r, tupled)),
      fc.constant(
        ParserT.Monad<S, F>().map2Eval_(
          l,
          Eval.later(() => r),
          tupled,
        ).value,
      ),
    ),
  );

export const flatMap = <S, F, A, B>(
  arbPA: Arbitrary<ParserT<S, F, A>>,
  arbPB: Arbitrary<ParserT<S, F, B>>,
): Arbitrary<ParserT<S, F, B>> =>
  fc
    .tuple(arbPA, fc.func<[A], ParserT<S, F, B>>(arbPB))
    .chain(([pa, f]) =>
      fc.oneof(
        fc.constant(pa.flatMap(f)),
        fc.constant(ParserT.Monad<S, F>().flatMap_(pa, f)),
      ),
    );

export const rep = <S, F, A>(
  arbP: Arbitrary<ParserT<S, F, A>>,
): Arbitrary<ParserT<S, F, List<A>>> => arbP.map(p => p.rep());

export const rep1 = <S, F, A>(
  arbP: Arbitrary<ParserT<S, F, A>>,
): Arbitrary<ParserT<S, F, List<A>>> => arbP.map(p => p.rep1());

// -- parse-text

export const satisfy = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> =>
  fc.func<[Char], boolean>(fc.boolean()).map(p => text.satisfy<S, F>(p));

export const oneOf = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> =>
  fc.string().map(s => text.oneOf<S, F>(s));
export const noneOf = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> =>
  fc.string().map(s => text.noneOf<S, F>(s));

export const char = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> =>
  fc.char().map(c => text.char<S, F>(c as Char));

export const letter = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> => fc.constant(text.letter<S, F>());

export const digit = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> => fc.constant(text.digit<S, F>());

export const alphaNum = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> => fc.constant(text.alphaNum<S, F>());

export const space = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, Char>> => fc.constant(text.space<S, F>());

export const spaces = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, void>> => fc.constant(text.spaces<S, F>());

export const string0 = (): Arbitrary<Parser<StringSource, string>> =>
  fc.string().map(s => text.string(s));
export const string = (): Arbitrary<Parser<StringSource, string>> =>
  fc
    .string()
    .filter(s => s.length > 0)
    .map(s => text.string(s));

export const stringF0 = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, string>> =>
  fc.string().map(s => text.stringF<S, F>(s));

export const stringF = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): Arbitrary<ParserT<S, F, string>> =>
  fc
    .string()
    .filter(s => s.length > 0)
    .map(s => text.stringF<S, F>(s));
