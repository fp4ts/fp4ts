// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class List<out A> {
  readonly __void!: void;

  readonly _A!: () => A;
}

// Definitions

export class Cons<A> extends List<A> {
  public constructor(public readonly _head: A, public _tail: List<A>) {
    super();
  }

  public override toString(): string {
    let cur = this._tail as List<A>;
    let acc = 'List(' + String(this.head);
    while (cur !== Nil) {
      acc += ', ' + (cur as Cons<A>)._head;
      cur = (cur as Cons<A>)._tail;
    }
    return acc + ')';
  }
}

export const Nil = new (class Nil extends List<never> {
  public override toString(): string {
    return 'List()';
  }
})();
export type Nil = typeof Nil;
