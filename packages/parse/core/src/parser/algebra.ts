// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, Lazy } from '@fp4ts/core';
import { EvalF, Monad, Option } from '@fp4ts/cats';
import { ParseResult } from './parse-result';
import { Consumed } from '../consumed';
import { State } from './state';
import { TokenType } from '../token-type';
import { SourcePosition } from '../source-position';

export abstract class ParserT<S, M, A> {
  private readonly __void!: void;
  private readonly _S!: (s: S) => void;
  private readonly _M!: M;
  private readonly _A!: () => A;
}

export class Succeed<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'succeed';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Fail<S, M> extends ParserT<S, M, never> {
  public readonly tag = 'fail';
  public constructor(public readonly msg: string) {
    super();
  }
}

export class Empty<S, M> extends ParserT<S, M, never> {
  public readonly tag = 'empty';
}

export class Defer<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'defer';
  public constructor(public readonly thunk: () => ParserT<S, M, A>) {
    super();
  }
}

export class UnconsPrim<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'uncons-prim';

  public constructor(
    public readonly showToken: (t: TokenType<S>) => string,
    public readonly nextPos: (
      sp: SourcePosition,
      t: TokenType<S>,
      s: S,
    ) => SourcePosition,
    public readonly test: (t: TokenType<S>) => Option<A>,
  ) {
    super();
  }
}

export class MakeParser<S, A> extends ParserT<S, EvalF, A> {
  public readonly tag = 'make-parser';
  public constructor(
    public readonly runParser: (s: State<S>) => Consumed<ParseResult<S, A>>,
  ) {
    super();
  }
}

export class MakeParserT<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'make-parser-t';
  public constructor(
    public readonly runParserT: (
      M: Monad<M>,
    ) => (s: State<S>) => Kind<M, [Consumed<Kind<M, [ParseResult<S, A>]>>]>,
  ) {
    super();
  }
}

export class Map<S, M, E, A> extends ParserT<S, M, A> {
  public readonly tag = 'map';
  public constructor(
    public readonly self: ParserT<S, M, E>,
    public readonly fun: (e: E) => A,
  ) {
    super();
  }
}

export class FlatMap<S, M, E, A> extends ParserT<S, M, A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: ParserT<S, M, E>,
    public readonly fun: (e: E) => ParserT<S, M, A>,
  ) {
    super();
  }
}

export class ManyAccumulate<S, M, E, A> extends ParserT<S, M, A> {
  public readonly tag = 'many-accumulate';
  public constructor(
    public readonly self: ParserT<S, M, E>,
    public readonly init: A,
    public readonly fun: (acc: A, x: E) => A,
  ) {
    super();
  }
}

export class Backtrack<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'backtrack';
  public constructor(public readonly self: ParserT<S, M, A>) {
    super();
  }
}

export class OrElse<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'or-else';
  public constructor(
    public readonly lhs: ParserT<S, M, A>,
    public readonly rhs: Lazy<ParserT<S, M, A>>,
  ) {
    super();
  }
}

export class Debug<S, M, A> extends ParserT<S, M, A> {
  public readonly tag = 'debug';
  public constructor(
    public readonly self: ParserT<S, M, A>,
    public readonly name: string,
  ) {
    super();
  }
}

export type View<S, M, A> =
  | Succeed<S, M, A>
  | Fail<S, M>
  | Empty<S, M>
  | Defer<S, M, A>
  | UnconsPrim<S, M, any>
  | MakeParser<S, A>
  | MakeParserT<S, M, A>
  | ManyAccumulate<S, M, any, A>
  | Map<S, M, any, A>
  | FlatMap<S, M, any, A>
  | Backtrack<S, M, A>
  | OrElse<S, M, A>
  | Debug<S, M, A>;
