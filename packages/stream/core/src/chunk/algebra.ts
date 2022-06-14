// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Byte, Char, Kind, PrimitiveType } from '@fp4ts/core';
import {
  Chain,
  Option,
  Either,
  Some,
  None,
  List,
  Vector,
  Applicative,
  Eval,
  Eq,
  Iter,
} from '@fp4ts/cats';

const te = new TextEncoder();

export abstract class Chunk<out O> {
  private readonly __void!: void;
  private readonly _O!: () => O;

  public static get empty(): Chunk<never> {
    return EmptyChunk;
  }
  public static get emptyChain(): ChainChunk<never> {
    return new ChainChunk(Chain.empty, 0);
  }
  public static singleton<O>(x: O): Chunk<O> {
    return new SingletonChunk(x);
  }

  public static fromArray<O>(os: O[]): Chunk<O> {
    return os.length === 0 ? Chunk.empty : new ArrayChunk(os);
  }
  public static fromList<O>(os: List<O>): Chunk<O> {
    return Chunk.fromArray(os.toArray);
  }
  public static fromVector<O>(os: Vector<O>): Chunk<O> {
    return Chunk.fromArray(os.toArray);
  }
  public static fromString(str: string): Chunk<Char> {
    return new StringChunk(str);
  }
  public static fromBuffer(
    buffer: ArrayBufferLike | Buffer | DataView | Uint8Array | string,
  ): Chunk<Byte> {
    if (
      buffer instanceof ArrayBuffer ||
      buffer instanceof Buffer ||
      buffer instanceof SharedArrayBuffer
    ) {
      return new ByteBufferChunk(new Uint8Array(buffer));
    } else if (buffer instanceof DataView) {
      return new ByteBufferChunk(new Uint8Array(buffer.buffer));
    } else if (buffer instanceof Uint8Array) {
      return new ByteBufferChunk(buffer);
    } else if (typeof buffer === 'string') {
      return new ByteBufferChunk(te.encode(buffer));
    } else {
      throw new Error('Unsupported type');
    }
  }

  public static tailRecM<S>(
    s: S,
  ): <A>(f: (s: S) => Chunk<Either<S, A>>) => Chunk<A> {
    return f => Chunk.tailRecM_(s, f);
  }

  public static tailRecM_<S, A>(
    s: S,
    f: (s: S) => Chunk<Either<S, A>>,
  ): Chunk<A> {
    const results: A[] = [];
    let stack = List(f(s).iterator);

    while (stack.nonEmpty) {
      const [hd, tl] = stack.uncons.get;
      const next = hd.next();

      if (next.done) {
        stack = tl;
      } else if (next.value.isRight) {
        results.push(next.value.get);
      } else {
        stack = tl.prepend(hd).prepend(f(next.value.getLeft).iterator);
      }
    }

    return Chunk.fromArray(results);
  }

  public get isEmpty(): boolean {
    return this.size === 0;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }
  public abstract readonly size: number;
  public abstract readonly iterator: Iterator<O>;

  public get lastOption(): Option<O> {
    return this.isEmpty ? None : Some(this.elem(this.size - 1));
  }

  public take(n: number): Chunk<O> {
    return this.splitAt(n)[0];
  }

  public takeRight(n: number): Chunk<O> {
    return n <= 0 ? EmptyChunk : this.drop(this.size - n);
  }

  public drop(n: number): Chunk<O> {
    return this.splitAt(n)[1];
  }

  public dropRight(n: number): Chunk<O> {
    return n <= 0 ? this : this.take(this.size - n);
  }

  public splitAt(idx: number): [Chunk<O>, Chunk<O>] {
    if (idx <= 0) return [EmptyChunk, this];
    if (idx >= this.size) return [this, EmptyChunk];
    return this.splitAt_(idx);
  }
  protected abstract splitAt_(idx: number): [Chunk<O>, Chunk<O>];

  public findIndex(pred: (o: O) => boolean): Option<number> {
    let idx = 0;
    const iter = this.iterator;
    for (let i = iter.next(); !i.done; i = iter.next(), idx++) {
      if (pred(i.value)) return Some(idx);
    }
    return None;
  }

  public elem(idx: number): O {
    if (idx < 0 || idx >= this.size) throw new Error('Index out of bounds');
    return this.elem_(idx);
  }
  public '!!'(idx: number): O {
    return this.elem(idx);
  }
  protected abstract elem_(idx: number): O;

  public slice(from: number, until: number): Chunk<O> {
    return this.drop(from).take(until - from);
  }

  public concat<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2> {
    if (this.isEmpty) return that;
    if (that.isEmpty) return this;
    if (that instanceof ChainChunk) return that.prependChunk(this);
    return new ChainChunk(Chain(this, that), this.size + that.size);
  }
  public '+++'<O2>(this: Chunk<O2>, that: Chunk<O2>): Chunk<O2> {
    return this.concat(that);
  }

  public filter(p: (o: O) => boolean): Chunk<O> {
    const results: O[] = new Array(this.size);
    const iter = this.iterator;

    let size = 0;
    for (let i = iter.next(); !i.done; i = iter.next()) {
      if (p(i.value)) {
        results[size++] = i.value;
      }
    }

    if (size === this.size) return new ArrayChunk(results);
    if (size === 0) return EmptyChunk;
    return new ArraySlice(results, 0, size);
  }

  public collect<O2>(p: (o: O) => Option<O2>): Chunk<O2> {
    const results: O2[] = new Array(this.size);
    const iter = this.iterator;

    let size = 0;
    for (let i = iter.next(); !i.done; i = iter.next()) {
      p(i.value).fold<void>(
        () => {},
        o2 => (results[size++] = o2),
      );
    }

    if (size === this.size) return new ArrayChunk(results);
    if (size === 0) return EmptyChunk;
    return new ArraySlice(results, 0, size);
  }

  public map<O2>(f: (o: O) => O2): Chunk<O2> {
    const results: O2[] = new Array(this.size);
    this.forEach((x, idx) => {
      results[idx] = f(x);
    });
    return Chunk.fromArray(results);
  }

  public mapAccumulate<S>(
    s: S,
  ): <O2>(f: (s: S, o: O) => [S, O2]) => [S, Chunk<O2>] {
    return <O2>(f: (s: S, o: O) => [S, O2]): [S, Chunk<O2>] => {
      const result: O2[] = new Array(this.size);
      let cur = s;
      this.forEach((o, idx) => {
        [cur, result[idx]] = f(cur, o);
      });
      return [cur, Chunk.fromArray(result)];
    };
  }

  public flatMap<O2>(f: (o: O) => Chunk<O2>): Chunk<O2> {
    if (this.isEmpty) return EmptyChunk;

    let result: Chunk<O2> = new ChainChunk(Chain.empty, 0);
    this.forEach(o => (result = result.concat(f(o))));
    return result;
  }

  public forEach(f: (o: O, index: number) => void): void {
    const it = this.iterator;
    for (let i = it.next(), idx = 0; !i.done; i = it.next(), idx++) {
      f(i.value, idx);
    }
  }

  public foldLeft<B>(z: B, f: (b: B, o: O) => B): B {
    let result: B = z;
    this.forEach(x => (result = f(result, x)));
    return result;
  }

  public scanLeft<O2>(z: O2, f: (o2: O2, o: O) => O2): Chunk<O2> {
    const results: O2[] = new Array(this.size + 1);
    results[0] = z;
    let carry = z;
    let i = 1;

    this.forEach(x => {
      carry = f(carry, x);
      results[i] = carry;
      i += 1;
    });

    return Chunk.fromArray(results);
  }

  public scanLeftCarry<O2>(z: O2, f: (o2: O2, o: O) => O2): [Chunk<O2>, O2] {
    const results: O2[] = new Array(this.size);
    let carry = z;
    let i = 0;

    this.forEach(x => {
      carry = f(carry, x);
      results[i] = carry;
      i += 1;
    });

    return [Chunk.fromArray(results), carry];
  }

  public zipWith<O2, O3>(that: Chunk<O2>, f: (o: O, o2: O2) => O3): Chunk<O3> {
    if (this.isEmpty || that.isEmpty) return EmptyChunk;
    const size = Math.min(this.size, that.size);
    const result: O3[] = new Array(size);
    for (let i = 0; i < size; i++) {
      result[i] = f(this.elem(i), that.elem(i));
    }
    return new ArrayChunk(result);
  }

  public traverse<F>(
    F: Applicative<F>,
  ): <O2>(f: (o: O) => Kind<F, [O2]>) => Kind<F, [Chunk<O2>]> {
    return <O2>(f: (o: O) => Kind<F, [O2]>): Kind<F, [Chunk<O2>]> => {
      if (this.isEmpty) return F.pure(EmptyChunk);

      // Max width of the tree -- max depth log_128(c.size)
      const width = 128;

      const loop = (start: number, end: number): Eval<Kind<F, [Chunk<O2>]>> => {
        if (end - start <= width) {
          // We've entered leaves of the tree
          let first = F.map_(f(this.elem(end - 1)), o2 => List(o2));
          for (let idx = end - 2; start <= idx; idx--) {
            first = F.map2_(f(this.elem(idx)), first)((h, t) => t.prepend(h));
          }
          return Eval.now(F.map_(first, Chunk.fromList));
        } else {
          const step = ((end - start) / width) | 0;

          let fchunk = Eval.defer(() => loop(start, start + step));

          for (
            let start0 = start + step, end0 = start0 + end;
            start0 < end;
            start0 += step, end0 += step
          ) {
            const end1 = Math.min(end, end0);
            const start1 = start0;
            fchunk = fchunk.flatMap(fv =>
              F.map2Eval_(
                fv,
                Eval.defer(() => loop(start1, end1)),
              )((xs, ys) => xs.concat(ys)),
            );
          }
          return fchunk;
        }
      };

      return loop(0, this.size).value;
    };
  }

  public startsWith<O2 extends PrimitiveType>(
    this: Chunk<O2>,
    that: Chunk<O2>,
  ): boolean;
  public startsWith<O2>(this: Chunk<O2>, that: Chunk<O2>, E: Eq<O2>): boolean;
  public startsWith(this: Chunk<any>, that: Chunk<any>, E?: Eq<any>): boolean {
    if (this.size < that.size) return false;
    return this.take(that.size).equals(that, E ?? Eq.primitive);
  }

  public equals<O2 extends PrimitiveType>(
    this: Chunk<O2>,
    that: Chunk<O2>,
  ): boolean;
  public equals<O2>(this: Chunk<O2>, that: Chunk<O2>, E: Eq<O2>): boolean;
  public equals(this: Chunk<any>, that: Chunk<any>, E?: Eq<any>): boolean {
    E = E ?? Eq.primitive;
    if (this === that) return true;
    if (this.size !== that.size) return false;
    const thisIter = this.iterator;
    const thatIter = that.iterator;
    for (
      let i = thisIter.next(), j = thatIter.next();
      !i.done && !j.done;
      i = thisIter.next(), j = thatIter.next()
    ) {
      if (E.notEquals(i.value, j.value)) return false;
    }
    return true;
  }
  public notEquals<O2 extends PrimitiveType>(
    this: Chunk<O2>,
    that: Chunk<O2>,
  ): boolean;
  public notEquals<O2>(this: Chunk<O2>, that: Chunk<O2>, E: Eq<O2>): boolean;
  public notEquals(this: Chunk<any>, that: Chunk<any>, E?: Eq<any>): boolean {
    return !this.equals(that, E ?? Eq.primitive);
  }

  public get toArray(): O[] {
    const xs: O[] = new Array(this.size);
    this.forEach((x, i) => (xs[i] = x));
    return xs;
  }

  public get toList(): List<O> {
    return List.fromIterator(this.iterator);
  }

  public get toVector(): Vector<O> {
    return Vector.fromIterator(this.iterator);
  }

  public toBuffer(this: Chunk<Byte>): Buffer {
    return Buffer.from(this.toUint8Array());
  }

  public toArrayBuffer(this: Chunk<Byte>): ArrayBuffer {
    return this.toUint8Array();
  }

  public toUint8Array(this: Chunk<Byte>): Uint8Array {
    const buffer: Uint8Array = new Uint8Array(this.size);
    let cur: Chunk<Byte>;
    let offset: number = 0;
    let rem: Chain<Chunk<Byte>> = Chain(this);

    while (rem.nonEmpty) {
      [cur, rem] = rem.popHead.get;
      if (cur === EmptyChunk) continue;
      if (cur instanceof ChainChunk) {
        rem = (cur.chunks as Chain<Chunk<Byte>>)['+++'](rem);
        continue;
      }

      if (cur instanceof ByteBufferChunk)
        buffer.set(new Uint8Array(cur.toUint8Array()), offset);
      // prettier-ignore
      if (cur instanceof SingletonChunk)
        buffer.set(cur.value, offset);
      if (cur instanceof ArrayChunk)
        buffer.set(new Uint8Array(cur.array), offset);
      if (cur instanceof ArraySlice)
        buffer.set(
          new Uint8Array(cur.values.slice(cur.offset, cur.offset + cur.length)),
          offset,
        );
      offset += cur.size;
    }

    return buffer;
  }
}

export class SingletonChunk<O> extends Chunk<O> {
  public readonly size: number = 1;
  public constructor(public readonly value: O) {
    super();
  }

  public get iterator(): Iterator<O> {
    return Iter.pure(this.value);
  }

  protected elem_(idx: number): O {
    return this.value;
  }
  protected splitAt_(idx: number): [Chunk<O>, Chunk<O>] {
    throw new Error('Impossible');
  }

  public override map<O2>(f: (o: O) => O2): Chunk<O2> {
    return new SingletonChunk(f(this.value));
  }
}

export class ArrayChunk<O> extends Chunk<O> {
  public readonly size: number;
  public constructor(public readonly array: O[]) {
    super();
    assert(
      array.length > 0,
      'Array chunk cannot be instantiated with an empty array',
    );
    this.size = array.length;
  }

  public get iterator(): Iterator<O> {
    return this.array[Symbol.iterator]();
  }

  protected elem_(idx: number): O {
    return this.array[idx];
  }

  protected splitAt_(idx: number): [Chunk<O>, Chunk<O>] {
    return [
      new ArraySlice(this.array, 0, idx),
      new ArraySlice(this.array, idx, this.size - idx),
    ];
  }

  public override map<O2>(f: (o: O) => O2): Chunk<O2> {
    return new ArrayChunk(this.array.map(x => f(x)));
  }
}

export class ArraySlice<O> extends Chunk<O> {
  public readonly size: number;
  public constructor(
    public readonly values: O[],
    public readonly offset: number,
    public readonly length: number,
  ) {
    super();
    assert(
      offset >= 0 &&
        offset <= values.length &&
        length > 0 &&
        length <= values.length &&
        offset + length <= values.length,
    );
    this.size = length;
  }

  public get iterator(): Iterator<O> {
    let i = 0;
    return Iter.lift(() =>
      i < this.size
        ? Iter.Result.pure(this.values[i++ + this.offset])
        : Iter.Result.done,
    );
  }

  protected elem_(idx: number): O {
    return this.values[this.offset + idx];
  }

  protected splitAt_(idx: number): [Chunk<O>, Chunk<O>] {
    return [
      new ArraySlice(this.values, this.offset, idx),
      new ArraySlice(this.values, this.offset + idx, this.length - idx),
    ];
  }
}

export class ChainChunk<O> extends Chunk<O> {
  public constructor(
    public readonly chunks: Chain<Chunk<O>>,
    public readonly size: number,
  ) {
    super();
  }

  public prependChunk<O2>(
    this: ChainChunk<O2>,
    that: Chunk<O2>,
  ): ChainChunk<O2> {
    return that.isEmpty
      ? this
      : new ChainChunk(this.chunks.prepend(that), this.size + that.size);
  }

  public appendChunk<O2>(
    this: ChainChunk<O2>,
    that: Chunk<O2>,
  ): ChainChunk<O2> {
    return that.isEmpty
      ? this
      : new ChainChunk(this.chunks.append(that), this.size + that.size);
  }

  public get iterator(): Iterator<O> {
    return Iter.flatMap_(this.chunks.iterator, c => c.iterator);
  }

  public override concat<O2>(this: ChainChunk<O2>, that: Chunk<O2>): Chunk<O2> {
    if (that.isEmpty) return this;
    if (this.isEmpty) return that;
    return this.appendChunk(that);
  }

  protected elem_(idx: number): O {
    let head: Chunk<O>;
    let chunks = this.chunks;
    let offset = idx;
    while (true) {
      [head, chunks] = chunks.popHead.get;
      if (offset < head.size) return head.elem(offset);
      offset -= head.size;
    }
  }

  protected splitAt_(idx: number): [Chunk<O>, Chunk<O>] {
    let prefix: ChainChunk<O> = Chunk.emptyChain;
    let head: Chunk<O>;
    let chunks = this.chunks;
    let offset = idx;
    let size = this.size;

    while (true) {
      [head, chunks] = chunks.popHead.get;
      size -= head.size;
      if (offset < head.size) {
        const [pfx, sfx] = head.splitAt(offset);
        return [prefix.concat(pfx), sfx.concat(new ChainChunk(chunks, size))];
      }
      offset -= head.size;
      prefix = prefix.appendChunk(head);
    }
  }
}

class EmptyChunk_ extends Chunk<never> {
  public readonly size: number = 0;
  public get iterator(): Iterator<never> {
    return Iter.empty;
  }
  protected elem_(idx: number): never {
    throw new Error('Impossible');
  }
  protected splitAt_(idx: number): [Chunk<never>, Chunk<never>] {
    throw new Error('Impossible');
  }

  public override map<B>(f: (x: never) => B): Chunk<never> {
    return EmptyChunk;
  }
}
export const EmptyChunk = new EmptyChunk_();
export type EmptyChunk = typeof EmptyChunk;

class StringChunk extends Chunk<Char> {
  public readonly size: number = this.string.length;
  public constructor(private readonly string: string) {
    super();
  }

  public get iterator(): Iterator<Char> {
    return this.string[Symbol.iterator]() as Iterator<Char>;
  }

  protected elem_(idx: number): Char {
    return this.string[idx] as Char;
  }

  protected splitAt_(idx: number): [Chunk<Char>, Chunk<Char>] {
    return [
      new StringSliceChunk(this.string, 0, idx),
      new StringSliceChunk(this.string, idx, this.size),
    ];
  }
}
class StringSliceChunk extends Chunk<Char> {
  public readonly size: number = this.length;
  public constructor(
    public readonly string: string,
    public readonly offset: number,
    public readonly length: number,
  ) {
    super();
    assert(
      offset >= 0 &&
        offset <= string.length &&
        length > 0 &&
        length <= string.length &&
        offset + length <= string.length,
    );
    this.size = length;
  }

  public get iterator(): Iterator<Char> {
    return this.string[Symbol.iterator]() as Iterator<Char>;
  }

  protected elem_(idx: number): Char {
    return this.string[this.offset + idx] as Char;
  }

  protected splitAt_(idx: number): [Chunk<Char>, Chunk<Char>] {
    return [
      new StringSliceChunk(this.string, this.offset + 0, idx),
      new StringSliceChunk(this.string, this.offset + idx, this.size - idx),
    ];
  }
}

class ByteBufferChunk extends Chunk<Byte> {
  public readonly size: number = this.buffer.length;
  public constructor(private readonly buffer: Uint8Array) {
    super();
  }

  public get iterator(): Iterator<Byte> {
    return this.buffer[Symbol.iterator]() as Iterator<Byte>;
  }

  protected elem_(idx: number): Byte {
    return this.buffer[idx] as Byte;
  }

  protected splitAt_(idx: number): [Chunk<Byte>, Chunk<Byte>] {
    return [
      new ByteBufferChunk(this.buffer.subarray(0, idx)),
      new ByteBufferChunk(this.buffer.subarray(idx)),
    ];
  }

  public override toUint8Array(): Uint8Array {
    return this.buffer;
  }
}
