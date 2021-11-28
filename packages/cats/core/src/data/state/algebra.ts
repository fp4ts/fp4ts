// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class State<S, A> {
  private readonly __void!: void;

  private readonly _S!: (s: S) => S;
  private readonly _A!: () => A;
}

export class Pure<S, A> extends State<S, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

export class FlatMap<S, E, A> extends State<S, A> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly self: State<S, E>,
    public readonly f: (a: E) => State<S, A>,
  ) {
    super();
  }
}

export class SetState<S> extends State<S, void> {
  public readonly tag = 'setState';
  public constructor(public readonly state: S) {
    super();
  }
}

export class GetState<S> extends State<S, S> {
  public readonly tag = 'getState';
}

export type View<S, A> =
  | Pure<S, A>
  | FlatMap<S, any, A>
  | SetState<S>
  | GetState<S>;

export const view = <S, A>(_: State<S, A>): View<S, A> => _ as any;
