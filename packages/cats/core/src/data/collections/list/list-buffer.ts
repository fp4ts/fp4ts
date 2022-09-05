// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Cons, Nil } from './algebra';

export class ListBuffer<A> {
  private first: List<A> = Nil;
  private last?: Cons<A>;
  private len: number = 0;

  private aliased: boolean = false;

  public get isEmpty(): boolean {
    return this.len === 0;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  public get toList(): List<A> {
    this.aliased = this.nonEmpty;
    return this.first;
  }

  private ensureUnAliased(): void {
    if (this.aliased) this.copyElems();
  }

  private copyElems(): void {
    const buf = ListBuffer.fromIterator(this.iterator());
    this.first = buf.first;
    this.last = buf.last;
    this.len = buf.len;
    this.aliased = false;
  }

  public *iterator(): Iterator<A> {
    if (this.isEmpty) return;

    let cur = this.first;
    const lst = this.last!;
    while (cur !== lst) {
      yield (cur as Cons<A>)._head;
      cur = (cur as Cons<A>)._tail;
    }
    yield (cur as Cons<A>)._head;
  }

  public addOne(x: A): this {
    this.ensureUnAliased();
    const tmp = new Cons(x, Nil);
    if (this.len === 0) this.first = tmp;
    else this.last!._tail = tmp;

    this.last = tmp;
    this.len += 1;
    return this;
  }

  public addAll(xs: List<A>): this {
    return this.addAllIterable(xs.iterator);
  }

  public addAllIterable(it: Iterator<A>): this {
    const fst = it.next();
    if (!fst.done) {
      const fresh = ListBuffer.fromIterator(it);
      this.ensureUnAliased();
      if (this.isEmpty) this.first = new Cons(fst.value, fresh.first);
      else this.last!._tail = new Cons(fst.value, fresh.first);
      this.last = fresh.last;
      this.len += fresh.len;
    }
    return this;
  }

  public static fromIterator<A>(it: Iterator<A>): ListBuffer<A> {
    const buf = new ListBuffer<A>();
    const fst = it.next();

    if (!fst.done) {
      const first = new Cons(fst.value, Nil);
      let last = first;
      let len = 1;

      for (let i = it.next(); !i.done; i = it.next(), len++) {
        const tmp = new Cons(i.value, Nil);
        last._tail = tmp;
        last = tmp;
      }

      buf.first = first as any;
      buf.last = last;
      buf.len = len;
    }

    return buf;
  }
}
