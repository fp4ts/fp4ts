// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, Kind, Lazy, tupled } from '@fp4ts/core';
import {
  AndThen,
  Either,
  Eval,
  EvalF,
  List,
  Monad,
  None,
  Option,
  Some,
} from '@fp4ts/cats';
import { Source, Stream, TokenType } from '@fp4ts/parse-kernel';

import { ParseError, Message } from '../parse-error';
import { SourcePosition } from '../source-position';

import {
  FlatMap,
  Map,
  RepAs,
  OrElse,
  ParserT,
  View,
  Debug,
  Labels,
  Backtrack,
} from './algebra';
import { Consumed } from '../consumed';
import { Failure, ParseResult, Success } from './parse-result';
import { State } from './state';
import { anyToken, empty, succeed, unexpected, unit } from './constructors';
import { StringSource } from '../string-source';
import { Accumulator, Accumulator1, Builder } from '../accumulator';

export const optional = <S, F, A>(
  p: ParserT<S, F, A>,
): ParserT<S, F, Option<A>> => orElse_(map_(p, Some), () => succeed(None));

export const filter_ = <S, F, A>(
  p: ParserT<S, F, A>,
  f: (a: A) => boolean,
): ParserT<S, F, A> => collect_(p, x => (f(x) ? Some(x) : None));

export const collect_ = <S, F, A, B>(
  p: ParserT<S, F, A>,
  f: (a: A) => Option<B>,
): ParserT<S, F, B> =>
  flatMap_(p, x => f(x).fold<ParserT<S, F, B>>(() => empty(), succeed));

export const map_ = <S, F, A, B>(
  p: ParserT<S, F, A>,
  f: (a: A) => B,
): ParserT<S, F, B> => new Map(p, f);

export const as_ = <S, F, A, B>(p: ParserT<S, F, A>, b: B): ParserT<S, F, B> =>
  new Map(p, () => b);

export const toUnit = <S, F, A>(p: ParserT<S, F, A>): ParserT<S, F, void> =>
  as_(p, undefined);

export const orElse_ = <S, F, A>(
  p1: ParserT<S, F, A>,
  p2: Lazy<ParserT<S, F, A>>,
): ParserT<S, F, A> => new OrElse(p1, p2);

export const ap_ = <S, F, A, B>(
  pf: ParserT<S, F, (a: A) => B>,
  pa: ParserT<S, F, A>,
): ParserT<S, F, B> => map2_(pf, pa)((f, a) => f(a));

export const map2_ =
  <S, F, A, B>(p1: ParserT<S, F, A>, p2: ParserT<S, F, B>) =>
  <C>(f: (a: A, b: B) => C): ParserT<S, F, C> =>
    flatMap_(p1, a => map_(p2, b => f(a, b)));

export const product_ = <S, F, A, B>(
  p1: ParserT<S, F, A>,
  p2: ParserT<S, F, B>,
): ParserT<S, F, [A, B]> => map2_(p1, p2)(tupled);

export const productL_ = <S, F, A, B>(
  p1: ParserT<S, F, A>,
  p2: ParserT<S, F, B>,
): ParserT<S, F, A> => map2_(p1, p2)(a => a);

export const productR_ = <S, F, A, B>(
  p1: ParserT<S, F, A>,
  p2: ParserT<S, F, B>,
): ParserT<S, F, B> => map2_(p1, p2)((_, b) => b);

export const flatMap_ = <S, F, A, B>(
  pa: ParserT<S, F, A>,
  f: (a: A) => ParserT<S, F, B>,
): ParserT<S, F, B> => new FlatMap(pa, f);

export const not = <S, F, A>(p: ParserT<S, F, A>): ParserT<S, F, void> =>
  backtrack(
    orElse_(
      flatMap_(backtrack(p), c => unexpected(`${c}`)),
      () => unit(),
    ),
  );

export const notFollowedBy_ = <S, F, A, B>(
  p: ParserT<S, F, A>,
  p2: ParserT<S, F, B>,
): ParserT<S, F, A> => productL_(p, not(p2));

export const skipRep_ = <S, F, A>(p: ParserT<S, F, A>): ParserT<S, F, void> =>
  repAs_(p, undefined, () => {});

export const rep_ = <S, F, A>(pa: ParserT<S, F, A>): ParserT<S, F, List<A>> =>
  map_(
    repAs_(pa, List.empty as List<A>, (xs, x) => xs.prepend(x)),
    xs => xs.reverse,
  );

export function repAs_<S, F, A, B>(
  p: ParserT<S, F, A>,
  init: B,
  f: (acc: B, a: A) => B,
): ParserT<S, F, B>;
export function repAs_<S, F, A, B>(
  p: ParserT<S, F, A>,
  acc: Accumulator<A, B>,
): ParserT<S, F, B>;
export function repAs_(
  p: ParserT<any, any, any>,
  init: any,
  f?: any,
): ParserT<any, any, any> {
  return f === undefined
    ? new RepAs(p, init)
    : new RepAs(p, Accumulator.make(init, f));
}

export const rep1_ = <S, F, A>(pa: ParserT<S, F, A>): ParserT<S, F, List<A>> =>
  flatMap_(pa, x => map_(rep_(pa), xs => xs.prepend(x)));

export function repAs1_<S, F, A>(
  p: ParserT<S, F, A>,
  f: (acc: A, a: A) => A,
): ParserT<S, F, A>;
export function repAs1_<S, F, A, B>(
  p: ParserT<S, F, A>,
  acc: Accumulator1<A, B>,
): ParserT<S, F, B>;
export function repAs1_(
  p: ParserT<any, any, any>,
  f: any,
): ParserT<any, any, any> {
  return typeof f === 'function'
    ? flatMap_(p, (x: any) => repAs_(p, x, f))
    : flatMap_(p, (x: any) =>
        repAs_(
          p,
          Accumulator.fromMkBuilder(() => f.makeBuilder(x)),
        ),
      );
}

export const sepBy_ = <S, F, A>(
  pa: ParserT<S, F, A>,
  tok: ParserT<S, F, TokenType<S>>,
): ParserT<S, F, List<A>> =>
  orElse_(sepBy1_(pa, tok), () => succeed(List.empty));

export const sepBy1_ = <S, F, A>(
  pa: ParserT<S, F, A>,
  tok: ParserT<S, F, TokenType<S>>,
): ParserT<S, F, List<A>> =>
  flatMap_(pa, x => map_(rep_(productR_(tok, pa)), xs => xs.prepend(x)));

export const chainLeft_ = <S, F, A>(
  p: ParserT<S, F, A>,
  z: A,
  op: ParserT<S, F, (x: A, y: A) => A>,
): ParserT<S, F, A> => orElse_(chainLeft1_(p, op), () => succeed(z));

export const chainLeft1_ = <S, F, A>(
  p: ParserT<S, F, A>,
  op: ParserT<S, F, (x: A, y: A) => A>,
): ParserT<S, F, A> => {
  const rest = (x: A): ParserT<S, F, A> =>
    orElse_(
      flatMap_(
        map2_(op, p)((f, y) => f(x, y)),
        rest,
      ),
      () => succeed(x),
    );

  return flatMap_(p, rest);
};

export const chainRight_ = <S, F, A>(
  p: ParserT<S, F, A>,
  z: A,
  op: ParserT<S, F, (x: A, y: A) => A>,
): ParserT<S, F, A> => orElse_(chainRight1_(p, op), () => succeed(z));

export const chainRight1_ = <S, F, A>(
  p: ParserT<S, F, A>,
  op: ParserT<S, F, (x: A, y: A) => A>,
): ParserT<S, F, A> => {
  const rest = (x: A): ParserT<S, F, A> =>
    orElse_(
      flatMap_(
        map2_(op, scan)((f, y) => f(x, y)),
        rest,
      ),
      () => succeed(x),
    );
  const scan = flatMap_(p, rest);

  return scan;
};

export const between_ = <S, F, A>(
  p: ParserT<S, F, A>,
  l: ParserT<S, F, any>,
  r: ParserT<S, F, any>,
): ParserT<S, F, A> => productR_(l, productL_(p, r));

export const surroundedBy_ = <S, F, A>(
  p: ParserT<S, F, A>,
  s: ParserT<S, F, any>,
): ParserT<S, F, A> => between_(p, s, s);

export const backtrack = <S, F, A>(p: ParserT<S, F, A>): ParserT<S, F, A> =>
  new Backtrack(p);

export const complete_ = <S, F, A>(p: ParserT<S, F, A>): ParserT<S, F, A> =>
  label_(notFollowedBy_(p, anyToken()), 'end of input');

// -- Parsing functions

export const parse = <A>(
  p: ParserT<StringSource, EvalF, A>,
  s: string,
): Either<ParseError, A> => parseSource(p, StringSource.fromString(s));

export const parseF =
  <M>(M: Monad<M>) =>
  <A>(
    p: ParserT<StringSource, M, A>,
    s: string,
  ): Kind<M, [Either<ParseError, A>]> =>
    parseSourceF(M)(p, StringSource.fromString(s));

export const parseSource = <A, S extends Source<any, any>>(
  p: ParserT<S, EvalF, A>,
  s: S,
): Either<ParseError, A> =>
  parseStream(Stream.forSource<EvalF, S>(Eval.Monad))(p, s).value;

export const parseSourceF =
  <F>(F: Monad<F>) =>
  <A, S extends Source<any, any>>(
    p: ParserT<S, F, A>,
    s: S,
  ): Kind<F, [Either<ParseError, A>]> =>
    parseStream(Stream.forSource<F, S>(F))(p, s);

export const parseStream =
  <S, F>(S: Stream<S, F>) =>
  <A>(p: ParserT<S, F, A>, s: S): Kind<F, [Either<ParseError, A>]> =>
    S.monad.flatMap_(parseConsumedF(S)(p, s), cons =>
      S.monad.map_(cons.value, result => result.toEither),
    );

export const parseConsumedF =
  <S, F>(S: Stream<S, F>) =>
  <A>(
    p: ParserT<S, F, A>,
    s: S,
  ): Kind<F, [Consumed<Kind<F, [ParseResult<S, A>]>>]> =>
    parseLoopImpl(
      S,
      new State(s, new SourcePosition(1, 1)),
      p,
      new Cont(
        /*cok: */ flow(S.monad.pure, Consumed.Consumed, S.monad.pure),
        /*cerr: */ flow(S.monad.pure, Consumed.Consumed, S.monad.pure),
        /*eok: */ flow(S.monad.pure, Consumed.Empty, S.monad.pure),
        /*eerr: */ flow(S.monad.pure, Consumed.Empty, S.monad.pure),
      ),
    );

// -- Debug

export const label_ = <S, F, A>(
  p: ParserT<S, F, A>,
  ...msgs: string[]
): ParserT<S, F, A> => new Labels(p, msgs);

export const debug_ = <S, F, A>(
  p: ParserT<S, F, A>,
  name: string,
): ParserT<S, F, A> => new Debug(p, name);

// -- Private implementation of the parsing of the input stream

interface ParseCtx<S, F, X, End> {
  readonly S: Stream<S, F>;
  readonly s: State<S>;
  readonly cont: Cont<S, F, X, End>;
  readonly go: <Z, End2>(
    s: State<S>,
    parser: ParserT<S, F, Z>,
    cont: Cont<S, F, Z, End2>,
  ) => Kind<F, [End2]>;
}

function parseLoopImpl<S, F, X, End>(
  S: Stream<S, F>,
  s: State<S>,
  parser: ParserT<S, F, X>,
  cont0: Cont<S, F, X, End>,
): Kind<F, [End]> {
  const go = <Y>(
    s: State<S>,
    p0: ParserT<S, F, Y>,
    c0: Cont<S, F, Y, End>,
  ): Kind<F, [End]> =>
    S.monad.flatMap_(S.monad.unit, () => parseLoopImpl(S, s, p0, c0));
  let cur_: ParserT<S, F, any> = parser;
  let cont_: Cont<S, F, any, End> = cont0;

  while (true) {
    const cur = cur_ as View<S, F, unknown>;
    const cont = cont_;

    switch (cur.tag) {
      case 'succeed':
        return cont.eok(
          new Success(cur.value, s, ParseError.empty(s.position)),
        );

      case 'fail':
        return cont.eerr(new Failure(new ParseError(s.position, [cur.msg])));

      case 'empty':
        return cont.eerr(new Failure(new ParseError(s.position, [])));

      case 'defer':
        cur_ = cur.thunk();
        break;

      case 'prim':
        return cur.runPrimParser(S)(s)(
          cont.cok,
          cont.cerr,
          cont.eok,
          cont.eerr,
        );

      case 'map':
        cur_ = cur.self;
        cont_ = new Cont(
          cont.cokContramap(suc => suc.map(cur.fun)),
          cont.cerr,
          cont.eokContramap(suc => suc.map(cur.fun)),
          cont.eerr,
        );
        break;

      case 'flatMap': {
        const ctx: ParseCtx<S, F, unknown, End> = { S, s, cont, go };
        cur_ = cur.self;
        cont_ = flatMapCont(ctx, cur.fun);
        break;
      }

      case 'many-accumulate': {
        const ctx: ParseCtx<S, F, unknown, End> = { S, s, cont, go };
        cur_ = cur.self;
        cont_ = mapAccumulateCont(ctx, cur.self, cur.acc);
        break;
      }

      case 'backtrack':
        cur_ = cur.self;
        cont_ = cont.copy({ cerr: cont.eerr });
        break;

      case 'or-else': {
        const ctx: ParseCtx<S, F, unknown, End> = { S, s, cont, go };
        cur_ = cur.lhs;
        cont_ = orElseCont(ctx, cur.rhs);
        break;
      }

      case 'labels': {
        const ctx: ParseCtx<S, F, unknown, End> = { S, s, cont, go };
        cur_ = cur.self;
        cont_ = labelsCont(ctx, cur.messages);
        break;
      }

      case 'debug': {
        cur_ = cur.self;
        cont_ = cont.debug(cur.name);
        console.log(`Debug: ${cur.name} ${s.position}`);
        break;
      }
    }
  }
}

function flatMapCont<S, F, Y, X, End>(
  { go, cont }: ParseCtx<S, F, X, End>,
  fun: (y: Y) => ParserT<S, F, X>,
): Cont<S, F, Y, End> {
  const mcok = (suc: Success<S, Y>): Kind<F, [End]> =>
    suc.error.isEmpty
      ? go(
          suc.remainder,
          fun(suc.output),
          cont.copy({ eok: cont.cok, eerr: cont.cerr }),
        )
      : go(
          suc.remainder,
          fun(suc.output),
          cont.copy({
            eok: cont.cokMergeError(suc.error),
            eerr: cont.cerrMergeError(suc.error),
          }),
        );

  const mcerr = cont.cerr;

  const meok = (suc: Success<S, Y>): Kind<F, [End]> =>
    suc.error.isEmpty
      ? go(suc.remainder, fun(suc.output), cont)
      : go(
          suc.remainder,
          fun(suc.output),
          cont.copy({
            eok: cont.eokMergeError(suc.error),
            eerr: cont.eerrMergeError(suc.error),
          }),
        );
  const meerr = cont.eerr;

  return new Cont(mcok, mcerr, meok, meerr);
}

function mapAccumulateCont<S, F, X, Z, End>(
  { go, s, cont }: ParseCtx<S, F, Z, End>,
  p: ParserT<S, F, X>,
  acc: Accumulator<X, Z>,
): Cont<S, F, X, End> {
  const walk =
    (bldr: Builder<X, Z>) =>
    (suc: Success<S, X>): Kind<F, [End]> => {
      bldr = bldr.append(suc.output);
      return go(
        suc.remainder,
        p,
        new Cont(walk(bldr), cont.cerr, repError, fail =>
          cont.cok(new Success(bldr.result, suc.remainder, fail.error)),
        ),
      );
    };

  return new Cont(walk(acc.newBuilder()), cont.cerr, repError, e =>
    cont.eok(new Success(acc.newBuilder().result, s, e.error)),
  );
}

function orElseCont<S, F, X, End>(
  { go, s, cont }: ParseCtx<S, F, X, End>,
  r: Lazy<ParserT<S, F, X>>,
): Cont<S, F, X, End> {
  const meerr = (fail: Failure) =>
    go(
      s,
      r(),
      cont.copy({
        eok: cont.eokMergeError(fail.error),
        eerr: cont.eerrMergeError(fail.error),
      }),
    );

  return cont.copy({ eerr: meerr });
}

function labelsCont<S, F, X, End>(
  { cont }: ParseCtx<S, F, X, End>,
  msgs: string[],
): Cont<S, F, X, End> {
  function setExpectedMsgs(error: ParseError): ParseError {
    if (msgs.length === 0) return error.withMessage(Message.Expected(''));
    let err0 = error.withMessage(Message.Expected(msgs[0]));
    for (let i = 1; i < msgs.length; i++) {
      err0 = err0.addMessage(Message.Expected(msgs[i]));
    }
    return err0;
  }

  return cont.copy({
    eok: cont.eokContramap(suc =>
      suc.error.isEmpty ? suc : suc.withError(setExpectedMsgs(suc.error)),
    ),
    eerr: cont.eerrContramap(fail =>
      fail.withError(setExpectedMsgs(fail.error)),
    ),
  });
}

class ParserRepError extends Error {}
function repError(): never {
  throw new ParserRepError(
    'Combinator `rep` applied to a parser that accepts an empty input',
  );
}

class Cont<S, F, X, End> {
  // prettier-ignore
  public constructor(
    public readonly cok : (suc: Success<S, X>) => Kind<F, [End]>,
    public readonly cerr: (fail: Failure  ) => Kind<F, [End]>,
    public readonly eok : (suc: Success<S, X>) => Kind<F, [End]>,
    public readonly eerr: (fail: Failure  ) => Kind<F, [End]>,
  ) {}

  public copy({
    cok = this.cok,
    cerr = this.cerr,
    eok = this.eok,
    eerr = this.eerr,
  }: Partial<Props<S, F, X, End>> = {}): Cont<S, F, X, End> {
    return new Cont(cok, cerr, eok, eerr);
  }

  public cokContramap<Y>(f: (suc: Success<S, Y>) => Success<S, X>) {
    return AndThen(this.cok).compose(f);
  }
  public cerrContramap(f: (suc: Failure) => Failure) {
    return AndThen(this.cerr).compose(f);
  }
  public eokContramap<Y>(f: (suc: Success<S, Y>) => Success<S, X>) {
    return AndThen(this.eok).compose(f);
  }
  public eerrContramap(f: (suc: Failure) => Failure) {
    return AndThen(this.eerr).compose(f);
  }

  public cokMergeError(error: ParseError) {
    return AndThen(this.cok).compose((suc: Success<S, X>) =>
      suc.mergeError(error),
    );
  }

  public cerrMergeError(error: ParseError) {
    return AndThen(this.cerr).compose((suc: Failure) => suc.mergeError(error));
  }

  public eokMergeError(error: ParseError) {
    return AndThen(this.eok).compose((suc: Success<S, X>) =>
      suc.mergeError(error),
    );
  }

  public eerrMergeError(error: ParseError) {
    return AndThen(this.eerr).compose((suc: Failure) => suc.mergeError(error));
  }

  public debug(name: string): Cont<S, F, X, End> {
    const log =
      (case_: string) =>
      <X>(x: X): X => {
        console.log(`Debug: ---> ${name} ${case_} ${x}`);
        return x;
      };
    return this.copy({
      cok: AndThen(this.cok).compose(log('cok')),
      cerr: AndThen(this.cerr).compose(log('cerr')),
      eok: AndThen(this.eok).compose(log('eok')),
      eerr: AndThen(this.eerr).compose(log('eerr')),
    });
  }
}

// prettier-ignore
type Props<S, F, X, End> = {
  readonly cok : (suc: Success<S, X>) => Kind<F, [End]>
  readonly cerr: (fail: Failure  ) => Kind<F, [End]>
  readonly eok : (suc: Success<S, X>) => Kind<F, [End]>
  readonly eerr: (fail: Failure  ) => Kind<F, [End]>
};
