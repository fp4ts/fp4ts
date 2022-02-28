// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, Lazy } from '@fp4ts/core';
import { Stream } from '@fp4ts/parse-kernel';

import { Message } from '../parse-error';

import { State } from './state';
import { Failure, Success } from './parse-result';
import { Accumulator } from '../accumulator';

export abstract class ParserT<S, F, A> {
  private readonly __void!: void;
  private readonly _S!: (s: S) => void;
  private readonly _F!: F;
  private readonly _A!: () => A;
}

export class Succeed<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'succeed';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Fail<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'fail';
  public constructor(public readonly msg: Message) {
    super();
  }
}

export class Empty<S, F> extends ParserT<S, F, never> {
  public readonly tag = 'empty';
}

export class Defer<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'defer';
  public constructor(public readonly thunk: () => ParserT<S, F, A>) {
    super();
  }
}

export class ParserPrim<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'prim';
  public constructor(
    public readonly runPrimParser: (
      S: Stream<S, F>,
    ) => (
      s: State<S>,
    ) => <B>(
      cok: (suc: Success<S, A>) => Kind<F, [B]>,
      cerr: (fail: Failure) => Kind<F, [B]>,
      eok: (suc: Success<S, A>) => Kind<F, [B]>,
      eerr: (fail: Failure) => Kind<F, [B]>,
    ) => Kind<F, [B]>,
  ) {
    super();
  }
}

export class Map<S, F, E, A> extends ParserT<S, F, A> {
  public readonly tag = 'map';
  public constructor(
    public readonly self: ParserT<S, F, E>,
    public readonly fun: (e: E) => A,
  ) {
    super();
  }
}

export class FlatMap<S, F, E, A> extends ParserT<S, F, A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: ParserT<S, F, E>,
    public readonly fun: (e: E) => ParserT<S, F, A>,
  ) {
    super();
  }
}

export class RepAs<S, F, E, A> extends ParserT<S, F, A> {
  public readonly tag = 'many-accumulate';
  public constructor(
    public readonly self: ParserT<S, F, E>,
    public readonly acc: Accumulator<E, A>,
  ) {
    super();
  }
}

export class Backtrack<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'backtrack';
  public constructor(public readonly self: ParserT<S, F, A>) {
    super();
  }
}

export class OrElse<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'or-else';
  public constructor(
    public readonly lhs: ParserT<S, F, A>,
    public readonly rhs: Lazy<ParserT<S, F, A>>,
  ) {
    super();
  }
}

export class Labels<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'labels';
  public constructor(
    public readonly self: ParserT<S, F, A>,
    public readonly messages: string[],
  ) {
    super();
  }
}

export class Debug<S, F, A> extends ParserT<S, F, A> {
  public readonly tag = 'debug';
  public constructor(
    public readonly self: ParserT<S, F, A>,
    public readonly name: string,
  ) {
    super();
  }
}

export type View<S, F, A> =
  | Succeed<S, F, A>
  | Fail<S, F, A>
  | Empty<S, F>
  | Defer<S, F, A>
  | ParserPrim<S, F, A>
  | Map<S, F, any, A>
  | FlatMap<S, F, any, A>
  | RepAs<S, F, any, A>
  | Backtrack<S, F, A>
  | OrElse<S, F, A>
  | Labels<S, F, A>
  | Debug<S, F, A>;
