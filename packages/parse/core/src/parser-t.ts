// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Eval,
  EvalF,
  Kind,
  lazy,
  throwError,
  tupled,
  TyK,
  TyVar,
} from '@fp4ts/core';
import {
  Alternative,
  Applicative,
  Either,
  Eq,
  Functor,
  FunctorFilter,
  isDefer,
  Left,
  Monad,
  MonadPlus,
  MonoidK,
  None,
  Option,
  Right,
  Some,
} from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { Source, Stream, TokenType } from '@fp4ts/parse-kernel';
import { Message, ParseError } from './parse-error';
import { SourcePosition } from './source-position';
import { StringSource } from './string-source';
import { State } from './state';

type Consumed<A> =
  | { readonly tag: 'consumed'; readonly value: A }
  | { readonly tag: 'empty'; readonly value: A };

const Consumed = <A>(value: A): Consumed<A> => ({ tag: 'consumed', value });
const Empty = <A>(value: A): Consumed<A> => ({ tag: 'empty', value });

type Reply<S, A> =
  | {
      readonly tag: 'ok';
      readonly output: A;
      readonly remainder: State<S>;
      readonly error: ParseError;
    }
  | { readonly tag: 'error'; readonly error: ParseError };

const Ok = <S, A>(
  output: A,
  remainder: State<S>,
  error: ParseError,
): Reply<S, A> => ({ tag: 'ok', output, remainder, error });
const Failure = <S, A>(error: ParseError): Reply<S, A> => ({
  tag: 'error',
  error,
});

/**
 * Monad transformer implementing a Parser.
 *
 * `ParserT` is parametrized by three type parameters, `S` for the input type,
 * `F` for the underlying monad, and `A` for the parser output.
 *
 * _Stack Safety_:
 *
 * `ParserT` achieves stack-safety is achieved by choosing an appropriate monad
 * `F`, such as `Eval`. This provides stack-safety for vast majority of the cases.
 */
export type ParserT<S, F, A> = _ParserT<S, F, A>;
export type Parser<S, A> = ParserT<S, EvalF, A>;

export function ParserT<S, F, A>(
  runParserPrim: RunParserPrim<S, F, A>,
): ParserT<S, F, A> {
  return new _ParserT(runParserPrim);
}
export const Parser = ParserT;

class _ParserT<S, F, out A> {
  public constructor(public readonly runParserPrim: RunParserPrim<S, F, A>) {}

  // -- Basic operations

  public map<B>(f: (a: A) => B): ParserT<S, F, B> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) =>
      this.runParserPrim(
        S,
        s,
        (a, r, e) => cok(f(a), r, e),
        cerr,
        (a, r, e) => eok(f(a), r, e),
        eerr,
      ),
    );
  }

  public as<B>(b: B): ParserT<S, F, B> {
    return this.map(_ => b);
  }

  public void(): ParserT<S, F, void> {
    return this.as(undefined);
  }

  public filter<B extends A>(f: (a: A) => a is B): ParserT<S, F, B>;
  public filter(f: (a: A) => boolean): ParserT<S, F, A>;
  public filter(f: (a: A) => boolean): ParserT<S, F, A> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) =>
      this.runParserPrim(
        S,
        s,
        (a, r, e) => (f(a) ? cok(a, r, e) : cerr(e)),
        cerr,
        (a, r, e) => (f(a) ? eok(a, r, e) : eerr(e)),
        eerr,
      ),
    );
  }

  public collect<B>(f: (a: A) => Option<B>): ParserT<S, F, B> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) =>
      this.runParserPrim(
        S,
        s,
        (a, r, e) => {
          const ob = f(a);
          return ob.nonEmpty ? cok(ob.get, r, e) : cerr(e);
        },
        cerr,
        (a, r, e) => {
          const ob = f(a);
          return ob.nonEmpty ? eok(ob.get, r, e) : eerr(e);
        },
        eerr,
      ),
    );
  }

  public orElse<A>(
    this: ParserT<S, F, A>,
    that: ParserT<S, F, A>,
  ): ParserT<S, F, A> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) => {
      const meerr = (err: ParseError) =>
        that.runParserPrim(
          S,
          s,
          cok,
          cerr,
          (x, r, err_) => eok(x, r, err.merge(err_)),
          err_ => eerr(err.merge(err_)),
        );
      return this.runParserPrim(S, s, cok, cerr, eok, meerr);
    });
  }
  public '<|>'<A>(
    this: ParserT<S, F, A>,
    that: ParserT<S, F, A>,
  ): ParserT<S, F, A> {
    return this.orElse(that);
  }

  public ap<A, B>(
    this: ParserT<S, F, (a: A) => B>,
    that: ParserT<S, F, A>,
  ): ParserT<S, F, B> {
    return this.flatMap(f => that.map(a => f(a)));
  }
  public '<*>'<A, B>(
    this: ParserT<S, F, (a: A) => B>,
    that: ParserT<S, F, A>,
  ): ParserT<S, F, B> {
    return this.ap(that);
  }

  public map2<B, C>(
    that: ParserT<S, F, B>,
    f: (a: A, b: B) => C,
  ): ParserT<S, F, C> {
    return this.flatMap(a => that.map(b => f(a, b)));
  }

  public product<B>(that: ParserT<S, F, B>): ParserT<S, F, [A, B]> {
    return this.flatMap(a => that.map(b => [a, b]));
  }

  public productL<B>(that: ParserT<S, F, B>): ParserT<S, F, A> {
    return this.flatMap(a => that.map(_ => a));
  }
  public '<*'<B>(that: ParserT<S, F, B>): ParserT<S, F, A> {
    return this.productL(that);
  }

  public productR<B>(that: ParserT<S, F, B>): ParserT<S, F, B> {
    return this.flatMap(_ => that);
  }
  public '*>'<B>(that: ParserT<S, F, B>): ParserT<S, F, B> {
    return this.productR(that);
  }

  public flatMap<B>(f: (a: A) => ParserT<S, F, B>): ParserT<S, F, B> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) => {
      const mcok = (output: A, s: State<S>, error: ParseError) =>
        error.isEmpty
          ? f(output).runParserPrim(S, s, cok, cerr, cok, cerr)
          : f(output).runParserPrim(
              S,
              s,
              cok,
              cerr,
              (b, s, err) => cok(b, s, error.merge(err)),
              err => cerr(error.merge(err)),
            );

      const meok = (output: A, s: State<S>, error: ParseError) =>
        error.isEmpty
          ? f(output).runParserPrim(S, s, cok, cerr, eok, eerr)
          : f(output).runParserPrim(
              S,
              s,
              cok,
              cerr,
              (b, s, err) => eok(b, s, error.merge(err)),
              err => eerr(error.merge(err)),
            );

      const F = S.monad;
      return isDefer(F)
        ? F.defer(() => this.runParserPrim(S, s, mcok, cerr, meok, eerr))
        : this.runParserPrim(S, s, mcok, cerr, meok, eerr);
    });
  }

  // -- Combinators

  public optional(): ParserT<S, F, Option<A>> {
    return new _ParserT((S, s, cok, cerr, eok, _eerr) =>
      this.runParserPrim(
        S,
        s,
        (a, s, e) => cok(Some(a), s, e),
        cerr,
        (a, s, e) => eok(Some(a), s, e),
        e => eok(None, s, e),
      ),
    );
  }

  public skipRep(): ParserT<S, F, void> {
    return this.repAs(undefined, (_x, _y) => undefined);
  }

  public skipRep1(): ParserT<S, F, void> {
    return this.productR(this.repAs(undefined, (_x, _y) => undefined));
  }

  public rep(): ParserT<S, F, List<A>> {
    return this.repAs(List.empty as List<A>, (xs, x) => xs.cons(x)).map(
      xs => xs.reverse,
    );
  }

  public rep1(): ParserT<S, F, List<A>> {
    return this.map2(this.rep(), List.cons);
  }

  public repVoid(): ParserT<S, F, void> {
    return this.repAs(undefined as void, (_a, _x) => {});
  }

  public repVoid1(): ParserT<S, F, void> {
    return this.productR(this.repVoid());
  }

  public repAs<B>(z: B, f: (b: B, a: A) => B): ParserT<S, F, B> {
    const p = this.runParserPrim;
    return new _ParserT(
      <X>(
        S: Stream<S, F>,
        s: State<S>,
        cok: (output: B, remainder: State<S>, err: ParseError) => Kind<F, [X]>,
        cerr: (err: ParseError) => Kind<F, [X]>,
        eok: (output: B, remainder: State<S>, err: ParseError) => Kind<F, [X]>,
        _eerr: (err: ParseError) => Kind<F, [X]>,
      ): Kind<F, [X]> => {
        const walk =
          (b: B) =>
          (x: A, s: State<S>, _err: ParseError): Kind<F, [X]> => {
            const next = f(b, x);
            return p(S, s, walk(next), cerr, repFail, e => cok(next, s, e));
          };

        return p(S, s, walk(z), cerr, repFail, e => eok(z, s, e));
      },
    );
  }

  public repAs1<B>(z: B, f: (b: B, a: A) => B): ParserT<S, F, B> {
    return this.flatMap(a => this.repAs(f(z, a), f));
  }

  public sepBy(sep: ParserT<S, F, unknown>): ParserT<S, F, List<A>> {
    return this.sepBy1(sep).orElse(ParserT.succeed(List.empty));
  }

  public sepBy1(sep: ParserT<S, F, unknown>): ParserT<S, F, List<A>> {
    return this.map2(sep.productR(this).rep(), List.cons);
  }

  public sepByAs<B>(
    sep: ParserT<S, F, unknown>,
    z: B,
    f: (z: B, a: A) => B,
  ): ParserT<S, F, B> {
    return this.sepByAs1(sep, z, f).orElse(ParserT.succeed(z));
  }

  public sepByAs1<B>(
    sep: ParserT<S, F, unknown>,
    z: B,
    f: (b: B, a: A) => B,
  ): ParserT<S, F, B> {
    return this.flatMap(a => sep.productR(this).repAs(f(z, a), f));
  }

  public chainLeft<A>(
    this: ParserT<S, F, A>,
    z: A,
    op: ParserT<S, F, (x: A, y: A) => A>,
  ): ParserT<S, F, A> {
    return this.chainLeft1(op).orElse(ParserT.succeed(z));
  }

  public chainLeft1<A>(
    this: ParserT<S, F, A>,
    op: ParserT<S, F, (x: A, y: A) => A>,
  ): ParserT<S, F, A> {
    return this.map2(
      op.map2(this, (f, r) => (l: A) => f(l, r)).rep(),
      (z, xs) => xs.foldLeft(z, (x, f) => f(x)),
    );
  }

  public chainRight<A>(
    this: ParserT<S, F, A>,
    z: A,
    op: ParserT<S, F, (x: A, y: A) => A>,
  ): ParserT<S, F, A> {
    return this.chainRight1(op).orElse(ParserT.succeed(z));
  }

  public chainRight1<A>(
    this: ParserT<S, F, A>,
    op: ParserT<S, F, (x: A, y: A) => A>,
  ): ParserT<S, F, A> {
    const go = (x: A, fxs: List<[(x: A, y: A) => A, A]>): Eval<A> =>
      fxs.fold(
        () => Eval.now(x),
        ([f, y], tl) => Eval.defer(() => go(y, tl)).map(z => f(x, z)),
      );

    return this.map2(op.product(this).rep(), (x, fxs) => go(x, fxs).value);
  }

  public backtrack(): ParserT<S, F, A> {
    return new _ParserT((S, s, cok, _cerr, eok, eerr) =>
      this.runParserPrim(S, s, cok, eerr, eok, eerr),
    );
  }

  public between(
    l: ParserT<S, F, unknown>,
    r: ParserT<S, F, unknown>,
  ): ParserT<S, F, A> {
    return l.productR(this).productL(r);
  }
  public surroundedBy(that: ParserT<S, F, unknown>): ParserT<S, F, A> {
    return this.between(that, that);
  }

  public not(show: (a: A) => string = String): ParserT<S, F, void> {
    return this.backtrack()
      .flatMap(a => ParserT.unexpected(show(a)))
      .orElse(ParserT.unit())
      .backtrack();
  }

  public complete(): ParserT<S, F, A> {
    return this.productL(ParserT.eof<S, F>());
  }

  // -- Debug

  public '<?>'(msg: string): ParserT<S, F, A> {
    return this.label(msg);
  }
  public label(...msgs: [string, ...string[]]): ParserT<S, F, A> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) =>
      this.runParserPrim(
        S,
        s,
        cok,
        cerr,
        (a, r, e) =>
          e.isEmpty ? eok(a, r, e) : eok(a, r, setExpectedMsgs(msgs, e)),
        e => eerr(setExpectedMsgs(msgs, e)),
      ),
    );
  }

  public trace(
    name: string,
    show: (a: A) => string = String,
  ): ParserT<S, F, A> {
    return new _ParserT((S, s, cok, cerr, eok, eerr) => {
      console.log(`Parser ${name} <-- ${s.position}`);
      const logOk = (consumed: boolean) => (a: A, s: State<S>, e: ParseError) =>
        consumed
          ? (console.log(`Parser ${name} cok: ${show(a)}, ${s.position}, ${e}`),
            cok(a, s, e))
          : (console.log(`Parser ${name} eok: ${show(a)}, ${s.position}, ${e}`),
            eok(a, s, e));
      const logErr = (consumed: boolean) => (e: ParseError) =>
        consumed
          ? (console.log(`Parser ${name} cerr: ${e}`), cerr(e))
          : (console.log(`Parser ${name} eerr: ${e}`), eerr(e));

      return this.runParserPrim(
        S,
        s,
        logOk(true),
        logErr(true),
        logOk(false),
        logErr(false),
      );
    });
  }

  // -- Running the Parser

  public parse(
    this: ParserT<StringSource, EvalF, A>,
    input: string,
  ): Kind<EvalF, [Either<ParseError, A>]> {
    return this.parseF(Monad.Eval, input);
  }

  public parseF(
    this: ParserT<StringSource, F, A>,
    F: Monad<F>,
    input: string,
  ): Kind<F, [Either<ParseError, A>]> {
    return this.parseSourceF(F, StringSource.fromString(input));
  }

  public parseSource<S extends Source<any, any>>(
    this: ParserT<S, EvalF, A>,
    input: S,
  ): Eval<Either<ParseError, A>> {
    return this.parseSourceF(Monad.Eval, input);
  }

  public parseSourceF<S extends Source<any, any>>(
    this: ParserT<S, F, A>,
    F: Monad<F>,
    input: S,
  ): Kind<F, [Either<ParseError, A>]> {
    return this.parseStream(Stream.forSource(F), input);
  }

  public parseStream(
    S: Stream<S, F>,
    input: S,
  ): Kind<F, [Either<ParseError, A>]> {
    return this.runParserPrim(
      S,
      { input, position: SourcePosition.initial },
      (x, _rem, _err) => S.monad.pure(Right(x)),
      err => S.monad.pure(Left(err)),
      (x, _rem, _err) => S.monad.pure(Right(x)),
      err => S.monad.pure(Left(err)),
    );
  }

  public runParser(
    S: Stream<S, F>,
    state: State<S>,
  ): Kind<F, [Consumed<Reply<S, A>>]> {
    const F = S.monad;
    return this.runParserPrim(
      S,
      state,
      (a, r, e) => F.pure(Consumed(Ok(a, r, e))),
      e => F.pure(Consumed(Failure(e))),
      (a, r, e) => F.pure(Empty(Ok(a, r, e))),
      e => F.pure(Empty(Failure(e))),
    );
  }
}

ParserT.succeed = <S, F, A>(a: A): ParserT<S, F, A> =>
  new _ParserT((S, s, _cok, _cerr, eok, _eerr) =>
    eok(a, s, ParseError.empty(s.position)),
  );

ParserT.unit = <S, F>(): ParserT<S, F, void> => ParserT.succeed(undefined);

ParserT.defer = <S, F, A>(that: () => ParserT<S, F, A>): ParserT<S, F, A> => {
  const lazyThat = lazy(that);
  return new _ParserT((S, s, cok, cerr, eok, eerr) =>
    isDefer(S)
      ? S.defer(() => lazyThat().runParserPrim(S, s, cok, cerr, eok, eerr))
      : lazyThat().runParserPrim(S, s, cok, cerr, eok, eerr),
  );
};

ParserT.fail = <S, F, A = never>(msg: string): ParserT<S, F, A> =>
  new _ParserT((S, s, _cok, _cerr, _eok, eerr) =>
    eerr(new ParseError(s.position, [Message.Raw(msg)])),
  );

ParserT.empty = <S, F, A = never>(): ParserT<S, F, A> =>
  new _ParserT((S, s, _cok, _cerr, _eok, eerr) =>
    eerr(new ParseError(s.position, [])),
  );

ParserT.unexpected = <S, F, A = never>(msg: string): ParserT<S, F, A> =>
  new _ParserT((S, s, _cok, _cerr, _eok, eerr) =>
    eerr(new ParseError(s.position, [Message.Unexpected(msg)])),
  );

ParserT.liftF = <S, F, A>(fa: Kind<F, [A]>): ParserT<S, F, A> =>
  new _ParserT((S, s, _cok, _cerr, eok, _eerr) =>
    S.monad.flatMap_(fa, a => eok(a, s, ParseError.empty(s.position))),
  );

ParserT.token = <S, F, A>(
  showToken: (t: TokenType<S>) => string,
  nextPos: (t: TokenType<S>) => SourcePosition,
  test: (t: TokenType<S>) => Option<A>,
): ParserT<S, F, A> =>
  ParserT.tokenPrim(showToken, (_sp, t, _s) => nextPos(t), test);

ParserT.tokenPrim = <S, F, A>(
  showToken: (t: TokenType<S>) => string,
  nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
  test: (t: TokenType<S>) => Option<A>,
): ParserT<S, F, A> =>
  new _ParserT((S, s, cok, _cerr, _eok, eerr) => {
    const M = S.monad;
    return M.flatMap_(M.unit, _ =>
      M.flatMap_(S.uncons(s.input), opt => {
        if (opt.isEmpty) return eerr(ParseError.unexpected(s.position, ''));

        const [tok, tl] = opt.get;
        const res = test(tok);

        return res.isEmpty
          ? eerr(ParseError.unexpected(s.position, showToken(tok)))
          : cok(
              res.get,
              { input: tl, position: nextPos(s.position, tok, tl) },
              ParseError.empty(s.position),
            );
      }),
    );
  });

ParserT.tokens = <S, F>(
  showTokens: (t: TokenType<S>[]) => string,
  nextPos: (sp: SourcePosition, ts: TokenType<S>[]) => SourcePosition,
  tts: TokenType<S>[],
  E: Eq<TokenType<S>> = Eq.fromUniversalEquals(),
): ParserT<S, F, TokenType<S>[]> =>
  new _ParserT(
    <B>(
      S: Stream<S, F>,
      s: State<S>,
      cok: (
        output: TokenType<S>[],
        remainder: State<S>,
        error: ParseError,
      ) => Kind<F, [B]>,
      cerr: (error: ParseError) => Kind<F, [B]>,
      eok: (
        output: TokenType<S>[],
        remainder: State<S>,
        error: ParseError,
      ) => Kind<F, [B]>,
      eerr: (error: ParseError) => Kind<F, [B]>,
    ): Kind<F, [B]> => {
      const length = tts.length;
      if (length === 0) return eok([], s, ParseError.empty(s.position));

      const errEof = () =>
        new ParseError(s.position, [Message.Unexpected('')]).setMessage(
          Message.Expected(showTokens(tts)),
        );
      const errExpect = (x: TokenType<S>) =>
        new ParseError(s.position, [Message.Unexpected('')]).setMessage(
          Message.Expected(showTokens([x])),
        );

      const ok = (rs: S): Kind<F, [B]> => {
        const position = nextPos(s.position, tts);
        const newState = { input: rs, position };
        return cok(tts, newState, ParseError.empty(position));
      };

      const F = S.monad;
      const walk = (idx: number, xs: S): Kind<F, [B]> =>
        idx >= length
          ? ok(xs)
          : F.flatMap_(S.uncons(xs), opt =>
              opt.fold(
                () => cerr(errEof()),
                ([x, xs]) =>
                  E.equals(tts[idx], x)
                    ? walk(idx + 1, xs)
                    : cerr(errExpect(x)),
              ),
            );

      return F.flatMap_(S.uncons(s.input), opt =>
        opt.fold(
          () => eerr(errEof()),
          ([x, xs]) => (E.equals(tts[0], x) ? walk(1, xs) : eerr(errExpect(x))),
        ),
      );
    },
  );

ParserT.eof = <S, F>(
  show: (t: TokenType<S>) => string = String,
): ParserT<S, F, void> => anyToken<S, F>(show).not(show);

ParserT.tailRecM_ = <S, F, A, B>(
  a: A,
  f: (a: A) => ParserT<S, F, Either<A, B>>,
): ParserT<S, F, B> =>
  new _ParserT(
    <X>(
      S: Stream<S, F>,
      s: State<S>,
      cok: (output: B, remainder: State<S>, error: ParseError) => Kind<F, [X]>,
      cerr: (error: ParseError) => Kind<F, [X]>,
      eok: (output: B, remainder: State<S>, error: ParseError) => Kind<F, [X]>,
      eerr: (error: ParseError) => Kind<F, [X]>,
    ): Kind<F, [X]> => {
      const F = S.monad;
      return F.tailRecM_(
        tupled(a, s, ParseError.empty(s.position), /* consumed */ false),
        ([a, s, e, c]) =>
          F.flatMap_(f(a).runParser(S, s), crea => {
            const consumed = c || crea.tag === 'consumed';
            const rea = crea.value;
            const e2 = rea.error.merge(e);

            if (rea.tag === 'ok') {
              // we can recurse iff we're in the success branch
              const { output, remainder } = rea;
              return output.isLeft()
                ? F.pure(Left(tupled(output.getLeft, remainder, e2, consumed)))
                : consumed
                ? F.map_(cok(output.get, remainder, e2), Right)
                : F.map_(eok(output.get, remainder, e2), Right);
            } else {
              return consumed
                ? F.map_(cerr(e2), Right)
                : F.map_(eerr(e2), Right);
            }
          }),
      );
    },
  );

interface RunParserPrim<S, F, A> {
  <B>(
    S: Stream<S, F>,
    s: State<S>,
    cok: (output: A, remainder: State<S>, error: ParseError) => Kind<F, [B]>,
    cerr: (error: ParseError) => Kind<F, [B]>,
    eok: (output: A, remainder: State<S>, error: ParseError) => Kind<F, [B]>,
    eerr: (error: ParseError) => Kind<F, [B]>,
  ): Kind<F, [B]>;
}

function setExpectedMsgs(msgs: string[], error: ParseError): ParseError {
  if (msgs.length === 0) return error.setMessage(Message.Expected(''));
  let err0 = error.setMessage(Message.Expected(msgs[0]));
  for (let i = 1; i < msgs.length; i++) {
    err0 = err0.addMessage(Message.Expected(msgs[i]));
  }
  return err0;
}

const repFail = () =>
  throwError(
    new Error(
      'ParserT.rep: Combinator `rep` is applied to a parser that accepts empty input',
    ),
  );

const anyToken = <S, F>(
  show: (a: TokenType<S>) => string = String,
): ParserT<S, F, TokenType<S>> =>
  ParserT.tokenPrim(show, (sp, _t, _s) => sp, Some);

// -- Instances

ParserT.MonoidK = <S, F>(): MonoidK<$<ParserTF, [S, F]>> =>
  MonoidK.of({ emptyK: ParserT.empty, combineK_: (fa, fb) => fa.orElse(fb) });

ParserT.Functor = <S, F>(): Functor<$<ParserTF, [S, F]>> =>
  Functor.of({ map_: (fa, f) => fa.map(f) });

ParserT.FunctorFilter = <S, F>(): FunctorFilter<$<ParserTF, [S, F]>> =>
  FunctorFilter.of({
    ...ParserT.Functor(),
    mapFilter_: (fa, f) => fa.collect(f),
    collect_: (fa, f) => fa.collect(f),
  });

ParserT.Applicative = <S, F>(): Applicative<$<ParserTF, [S, F]>> =>
  Applicative.of<$<ParserTF, [S, F]>>({
    ...ParserT.Functor(),
    pure: ParserT.succeed,
    ap_: (ff, fa) => ff.ap(fa),
    map2_: (fa, fb, f) => fa.map2(fb, f),
    product_: (fa, fb) => fa.product(fb),
    productL_: (fa, fb) => fa.productL(fb),
    productR_: (fa, fb) => fa.productR(fb),
  });

ParserT.Alternative = <S, F>(): Alternative<$<ParserTF, [S, F]>> =>
  Alternative.of({
    ...ParserT.Applicative(),
    ...ParserT.MonoidK(),
    many: fa => fa.rep().map(xs => xs.toArray),
    many1: fa => fa.rep1().map(xs => xs.toArray),
  });

ParserT.Monad = <S, F>(): Monad<$<ParserTF, [S, F]>> =>
  Monad.of({
    pure: ParserT.succeed,
    unit: ParserT.unit(),
    map_: (pa, f) => pa.map(f),
    flatMap_: (pa, f) => pa.flatMap(f),
    tailRecM_: ParserT.tailRecM_,
  });

ParserT.MonadPlus = <S, F>(): MonadPlus<$<ParserTF, [S, F]>> =>
  MonadPlus.of({
    ...ParserT.Monad(),
    ...ParserT.Alternative(),
    ...ParserT.FunctorFilter(),
  });

// -- HKT

export interface ParserTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: ParserT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
