// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class Either<E, A> {
  private readonly __void!: void;
  private readonly _E!: () => E;
  private readonly _A!: () => A;

  public abstract readonly get: A;
  public abstract readonly getLeft: E;

  public abstract fold<B1, B2 = B1>(
    onLeft: (e: E) => B1,
    onRight: (a: A) => B2,
  ): B1 | B2;
}

export class Right<A> extends Either<never, A> {
  public readonly tag = 'right';
  public constructor(public readonly value: A) {
    super();
  }

  public get get(): A {
    return this.value;
  }
  public get getLeft(): never {
    throw new Error('Right.getLeft');
  }

  public fold<B1, B2 = B1>(
    onLeft: (e: never) => B1,
    onRight: (a: A) => B2,
  ): B1 | B2 {
    return onRight(this.value);
  }

  public override toString(): string {
    return `[Right value: ${this.value}]`;
  }
}

export class Left<E> extends Either<E, never> {
  public readonly tag = 'left';
  public constructor(public readonly value: E) {
    super();
  }

  public get get(): never {
    throw new Error('Left.get');
  }
  public get getLeft(): E {
    return this.value;
  }

  public fold<B1, B2 = B1>(
    onLeft: (e: E) => B1,
    onRight: (a: never) => B2,
  ): B1 | B2 {
    return onLeft(this.value);
  }

  public override toString(): string {
    return `[Left value: ${this.value}]`;
  }
}

type View<E, A> = Left<E> | Right<A>;

export const view = <E, A>(_: Either<E, A>): View<E, A> => _ as any;
