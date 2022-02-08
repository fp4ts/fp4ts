import { ok as assert } from 'assert';
import { throwError } from '@fp4ts/core';
import { Option, Some, None } from '../../option';
import {
  BITS,
  WIDTH,
  MASK,
  BITS2,
  WIDTH2,
  BITS3,
  WIDTH3,
  BITS4,
  WIDTH4,
  BITS5,
  WIDTH5,
  BITS6,
  WIDTH6,
  LASTWIDTH,
  Log2ConcatFaster,
  Arr1,
  Arr2,
  Arr3,
  Arr4,
  Arr5,
  Arr6,
} from './constants';
import { VectorSliceBuilder } from './slice-builder';
import {
  arrIterator,
  ioob,
  mapElems,
  mapElems1,
  wrap1,
  wrap2,
  wrap3,
  wrap4,
  wrap5,
} from './helpers';
import { VectorBuilder } from './vector-builder';

export abstract class Vector<A> {
  private readonly __void!: void;
  private readonly _A!: () => A;

  public static get empty(): Vector<never> {
    return Vector0;
  }

  public static fromArray<A>(xs: A[]): Vector<A> {
    return xs.reduce((ys, x) => ys.append(x), Vector.empty as Vector<A>);
  }

  public static fromArray1<A>(xs: A[]): Vector<A> {
    return xs.reduce((b, x) => b.addOne(x), new VectorBuilder<A>()).toVector();
  }

  public abstract readonly size: number;

  public get toArray(): A[] {
    const res = new Array(this.size);
    let idx = 0;
    for (const x of this) {
      res[idx++] = x;
    }
    return res;
  }

  [Symbol.iterator](): Iterator<A> {
    return iterator(this);
  }

  public abstract prepend<B>(this: Vector<B>, that: B): Vector<B>;
  public abstract append<B>(this: Vector<B>, that: B): Vector<B>;

  public abstract map<B>(f: (a: A) => B): Vector<B>;

  public slice(from: number, to: number): Vector<A> {
    const lo = Math.max(0, from);
    const hi = Math.min(this.size, to);
    const len = hi - lo;

    return len === this.size ? this : hi <= lo ? Vector0 : this.slice0(lo, hi);
  }

  protected abstract slice0(lo: number, hi: number): Vector<A>;
}

const Vector0: Vector<never> & { tag: 0 } =
  new (class Vector0 extends Vector<never> {
    public readonly tag = 0;

    public readonly size: number = 0;

    public elem(idx: number): never {
      return ioob(idx);
    }

    public elemOption(idx: number): Option<never> {
      return None;
    }

    public prepend<B>(that: B): Vector<B> {
      return new Vector1(wrap1(that));
    }

    public append<B>(that: B): Vector<B> {
      return new Vector1(wrap1(that));
    }

    public map<B>(f: (x: never) => B): Vector<B> {
      return this;
    }

    protected slice0(lo: number, hi: number): Vector<never> {
      return this;
    }
  })();

export class Vector1<A> extends Vector<A> {
  public readonly tag = 1;
  public constructor(public readonly data1: unknown[]) {
    super();
  }

  public get size(): number {
    return this.data1.length;
  }

  private copy<B>({ data1 = this.data1 }: Partial<Props1> = {}): Vector1<B> {
    return new Vector1(data1);
  }

  public elem(idx: number): A {
    return idx >= 0 && idx < this.data1.length
      ? (this.data1[idx] as A)
      : ioob(idx);
  }

  public elemOption(idx: number): Option<A> {
    return idx >= 0 && idx < this.data1.length
      ? Some(this.data1[idx] as A)
      : None;
  }

  public prepend<B>(this: Vector1<B>, that: B): Vector<B> {
    const len1 = this.data1.length;
    return len1 < WIDTH
      ? new Vector1([that, ...this.data1])
      : new Vector2(wrap1(that), 1, [], this.data1, WIDTH + 1);
  }

  public append<B>(this: Vector1<B>, that: B): Vector<B> {
    const len1 = this.data1.length;
    return len1 < WIDTH
      ? new Vector1([...this.data1, that])
      : new Vector2(this.data1, WIDTH, [], wrap1(that), WIDTH + 1);
  }

  public map<B>(f: (a: A) => B): Vector<B> {
    return new Vector1(this.data1.map(x => f(x as A)));
  }

  protected slice0(lo: number, hi: number): Vector<A> {
    return new Vector1(this.data1.slice(lo, hi));
  }
}

export class Vector2<A> extends Vector<A> {
  public readonly tag = 2;
  // prettier-ignore
  public constructor(
    public readonly prefix1: Arr1, public readonly len1: number,
    public readonly data2: Arr2,
    public readonly suffix1: Arr1,
    public readonly len0: number,
  ) {
    super();
  }

  public get size(): number {
    return this.len0;
  }

  private copy<B>({
    prefix1 = this.prefix1,
    len1 = this.len1,
    data2 = this.data2,
    suffix1 = this.suffix1,
    len0 = this.len0,
  }: Partial<Props2> = {}): Vector2<B> {
    return new Vector2(prefix1, len1, data2, suffix1, len0);
  }

  public elem(idx: number): A {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len1;
      if (idx >= 0) {
        const i2 = io >>> BITS;
        const i1 = io & MASK;
        return i2 < this.data2.length
          ? (this.data2[i2][i1] as A)
          : (this.suffix1[i1] as A);
      } else {
        return this.prefix1[idx] as A;
      }
    } else {
      return ioob(idx);
    }
  }

  public elemOption(idx: number): Option<A> {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len1;
      if (idx >= 0) {
        const i2 = io >>> BITS;
        const i1 = io & MASK;
        return i2 < this.data2.length
          ? Some(this.data2[i2][i1] as A)
          : Some(this.suffix1[i1] as A);
      } else {
        return Some(this.prefix1[idx] as A);
      }
    } else {
      return None;
    }
  }

  public prepend<B>(this: Vector2<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.len1 < WIDTH
      ? this.copy({ prefix1: [that, ...this.prefix1], len1: this.len1 + 1, len0: this.len0 + 1 })
    : this.data2.length < WIDTH - 2
      ? this.copy({ prefix1: wrap1(that), len1: 1, data2: [this.prefix1, ...this.data2], len0: this.len0 + 1 })
    : new Vector3(wrap1(that), 1, wrap2(this.prefix1), this.len1 + 1, [], this.data2, this.suffix1, this.len0 + 1);
  }

  public append<B>(this: Vector2<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.suffix1.length < WIDTH
      ? this.copy({ suffix1: [...this.suffix1, that], len0: this.len0 + 1 })
    : this.data2.length < WIDTH - 2
      ? this.copy({ data2: [...this.data2, this.suffix1], suffix1: wrap1(that), len0: this.len0 + 1 })
    : new Vector3(this.prefix1, this.len1, this.data2, WIDTH * (WIDTH - 2) + this.len1, [], wrap2(this.suffix1), wrap1(that), this.len0 + 1);
  }

  public map<B>(f: (a: A) => B): Vector<B> {
    return this.copy({
      prefix1: mapElems1(this.prefix1, f),
      data2: mapElems(2, this.data2, f),
      suffix1: mapElems1(this.suffix1, f),
    });
  }

  protected slice0(lo: number, hi: number): Vector<A> {
    const builder = new VectorSliceBuilder<A>(lo, hi);
    return builder
      .consider(1, this.prefix1)
      .consider(2, this.data2)
      .consider(1, this.suffix1)
      .toVector();
  }
}

export class Vector3<A> extends Vector<A> {
  public readonly tag = 3;
  // prettier-ignore
  public constructor(
    public readonly prefix1: Arr1, public readonly len1: number,
    public readonly prefix2: Arr2, public readonly len12: number,
    public readonly data3: Arr3,
    public readonly suffix2: Arr2,
    public readonly suffix1: Arr1,
    public readonly len0: number,
  ) {
    super();
  }

  public get size(): number {
    return this.len0;
  }

  private copy<B>({
    prefix1 = this.prefix1,
    len1 = this.len1,
    prefix2 = this.prefix2,
    len12 = this.len12,
    data3 = this.data3,
    suffix2 = this.suffix2,
    suffix1 = this.suffix1,
    len0 = this.len0,
  }: Partial<Props3>): Vector3<B> {
    // prettier-ignore
    return new Vector3(prefix1, len1, prefix2, len12, data3, suffix2, suffix1, len0);
  }

  public elem(idx: number): A {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len12;
      if (idx >= 0) {
        const i3 = io >>> BITS2;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i3 < this.data3.length
          ? (this.data3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? (this.suffix2[i2][i1] as A)
          : (this.suffix1[i1] as A);
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return this.prefix2[io >>> BITS][io & MASK] as A;
      } else {
        return this.prefix1[idx] as A;
      }
    } else {
      return ioob(idx);
    }
  }

  public elemOption(idx: number): Option<A> {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len12;
      if (idx >= 0) {
        const i3 = io >>> BITS2;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i3 < this.data3.length
          ? Some(this.data3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? Some(this.suffix2[i2][i1] as A)
          : Some(this.suffix1[i1] as A);
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return Some(this.prefix2[io >>> BITS][io & MASK] as A);
      } else {
        return Some(this.prefix1[idx] as A);
      }
    } else {
      return None;
    }
  }

  public prepend<B>(this: Vector3<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.len1 < WIDTH
      ? this.copy({ prefix1: [that, ...this.prefix1], len1: this.len1 + 1, len12: this.len12 + 1, len0: this.len0 + 1 })
    : this.len12 < WIDTH2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [this.prefix1, ...this.prefix2], len12: this.len12 + 1, len0: this.len0 + 1 })
    : this.data3.length < WIDTH - 2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, data3: [[this.prefix1, ...this.prefix2], ...this.data3], len0: this.len0 + 1 })
    : new Vector4(wrap1(that), 1, [], 1, wrap3([this.prefix1, ...this.prefix2]), this.len12 + 1, [], this.data3, this.suffix2, this.suffix1, this.len0 + 1);
  }

  public append<B>(this: Vector3<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.suffix1.length < WIDTH
      ? this.copy({ suffix1: [...this.suffix1, that], len0: this.len0 + 1 })
    : this.suffix2.length < WIDTH - 1
      ? this.copy({ suffix2: [...this.suffix2, this.suffix1], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.data3.length < WIDTH - 2
      ? this.copy({ data3: [...this.data3, [...this.suffix2, this.suffix1]], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : new Vector4(this.prefix1, this.len1, this.prefix2, this.len12, this.data3, (WIDTH - 2) * WIDTH + this.len12, [], wrap3([...this.suffix2, this.suffix1]), [], wrap1(that), this.len0 + 1);
  }

  public map<B>(f: (a: A) => B): Vector<B> {
    return this.copy({
      prefix1: mapElems1(this.prefix1, f),
      prefix2: mapElems(2, this.prefix2, f),
      data3: mapElems(3, this.data3, f),
      suffix2: mapElems(2, this.suffix2, f),
      suffix1: mapElems1(this.suffix1, f),
    });
  }

  protected slice0(lo: number, hi: number): Vector<A> {
    const builder = new VectorSliceBuilder<A>(lo, hi);
    return builder
      .consider(1, this.prefix1)
      .consider(2, this.prefix2)
      .consider(3, this.data3)
      .consider(2, this.suffix2)
      .consider(1, this.suffix1)
      .toVector();
  }
}

export class Vector4<A> extends Vector<A> {
  public readonly tag = 4;
  // prettier-ignore
  public constructor(
    public readonly prefix1: Arr1, public readonly len1: number,
    public readonly prefix2: Arr2, public readonly len12: number,
    public readonly prefix3: Arr3, public readonly len123: number,
    public readonly data4: Arr4,
    public readonly suffix3: Arr3,
    public readonly suffix2: Arr2,
    public readonly suffix1: Arr1,
    public readonly len0: number,
  ) {
    super();
  }

  public get size(): number {
    return this.len0;
  }

  private copy<B>({
    prefix1 = this.prefix1,
    len1 = this.len1,
    prefix2 = this.prefix2,
    len12 = this.len12,
    prefix3 = this.prefix3,
    len123 = this.len123,
    data4 = this.data4,
    suffix3 = this.suffix3,
    suffix2 = this.suffix2,
    suffix1 = this.suffix1,
    len0 = this.len0,
  }: Partial<Props4> = {}): Vector4<B> {
    // prettier-ignore
    return new Vector4(prefix1, len1, prefix2, len12, prefix3, len123, data4, suffix3, suffix2, suffix1, len0);
  }

  public elem(idx: number): A {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len123;
      if (idx >= 0) {
        const i4 = io >>> BITS3;
        const i3 = (io >>> BITS2) & MASK;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i4 < this.data4.length
          ? (this.data4[i4][i3][i2][i1] as A)
          : i3 < this.suffix3.length
          ? (this.suffix3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? (this.suffix2[i2][i1] as A)
          : (this.suffix1[i1] as A);
      } else if (idx >= this.len12) {
        const io = idx - this.len12;
        return this.prefix3[io >>> BITS2][(io >>> BITS) & MASK][io & MASK] as A;
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return this.prefix2[io >>> BITS][io & MASK] as A;
      } else {
        return this.prefix1[idx] as A;
      }
    } else {
      return ioob(idx);
    }
  }

  public elemOption(idx: number): Option<A> {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len123;
      if (idx >= 0) {
        const i4 = io >>> BITS3;
        const i3 = (io >>> BITS2) & MASK;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i3 < this.data4.length
          ? Some(this.data4[i4][i3][i2][i1] as A)
          : i3 < this.suffix3.length
          ? Some(this.suffix3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? Some(this.suffix2[i2][i1] as A)
          : Some(this.suffix1[i1] as A);
      } else if (idx >= this.len12) {
        const io = idx - this.len12;
        return Some(
          this.prefix3[io >>> BITS2][(io >>> BITS) & MASK][io & MASK] as A,
        );
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return Some(this.prefix2[io >>> BITS][io & MASK] as A);
      } else {
        return Some(this.prefix1[idx] as A);
      }
    } else {
      return ioob(idx);
    }
  }

  public prepend<B>(this: Vector4<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.len1 < WIDTH
      ? this.copy({ prefix1: [that, ...this.prefix1], len1: this.len1 + 1, len12: this.len12 + 1, len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len12 < WIDTH2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [this.prefix1, ...this.prefix2], len12: this.len12 + 1, len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len123 < WIDTH3
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [[this.prefix1, ...this.prefix2], ...this.prefix3], len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.data4.length < WIDTH - 2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [], data4: [[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.data4], len0: this.len0 + 1 })
    : new Vector5(wrap1(that), 1, [], 1, [], 1, wrap4([[this.prefix1, ...this.prefix2], ...this.prefix3]), this.len123 + 1, [], this.data4, this.suffix3, this.suffix2, this.suffix1, this.len0 + 1);
  }

  public append<B>(this: Vector4<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.suffix1.length < WIDTH
      ? this.copy({ suffix1: [...this.suffix1, that], len0: this.len0 + 1 })
    : this.suffix2.length < WIDTH - 1
      ? this.copy({ suffix2: [...this.suffix2, this.suffix1], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.suffix3.length < WIDTH - 1
      ? this.copy({ suffix3: [...this.suffix3, [...this.suffix2, this.suffix1]], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.data4.length < WIDTH - 2
      ? this.copy({ data4: [...this.data4, [...this.suffix3, [...this.suffix2, this.suffix1]]], suffix3: [], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : new Vector5(this.prefix1, this.len1, this.prefix2, this.len12, this.prefix3, this.len123, this.data4, (WIDTH - 2) * WIDTH3 + this.len123, [], wrap4([...this.suffix3, [...this.suffix2, this.suffix1]]), [], [], wrap1(that), this.len0 + 1);
  }

  public map<B>(f: (a: A) => B): Vector<B> {
    return this.copy({
      prefix1: mapElems1(this.prefix1, f),
      prefix2: mapElems(2, this.prefix2, f),
      prefix3: mapElems(3, this.prefix3, f),
      data4: mapElems(4, this.data4, f),
      suffix3: mapElems(3, this.suffix3, f),
      suffix2: mapElems(2, this.suffix2, f),
      suffix1: mapElems1(this.suffix1, f),
    });
  }

  protected slice0(lo: number, hi: number): Vector<A> {
    const builder = new VectorSliceBuilder<A>(lo, hi);
    return builder
      .consider(1, this.prefix1)
      .consider(2, this.prefix2)
      .consider(3, this.prefix3)
      .consider(4, this.data4)
      .consider(3, this.suffix3)
      .consider(2, this.suffix2)
      .consider(1, this.suffix1)
      .toVector();
  }
}

export class Vector5<A> extends Vector<A> {
  public readonly tag = 5;
  // prettier-ignore
  public constructor(
    public readonly prefix1: Arr1, public readonly len1: number,
    public readonly prefix2: Arr2, public readonly len12: number,
    public readonly prefix3: Arr3, public readonly len123: number,
    public readonly prefix4: Arr4, public readonly len1234: number,
    public readonly data5: Arr5,
    public readonly suffix4: Arr4,
    public readonly suffix3: Arr3,
    public readonly suffix2: Arr2,
    public readonly suffix1: Arr1,
    public readonly len0: number,
  ) {
    super();
  }

  public get size(): number {
    return this.len0;
  }

  private copy<B>({
    prefix1 = this.prefix1,
    len1 = this.len1,
    prefix2 = this.prefix2,
    len12 = this.len12,
    prefix3 = this.prefix3,
    len123 = this.len123,
    prefix4 = this.prefix4,
    len1234 = this.len1234,
    data5 = this.data5,
    suffix4 = this.suffix4,
    suffix3 = this.suffix3,
    suffix2 = this.suffix2,
    suffix1 = this.suffix1,
    len0 = this.len0,
  }: Partial<Props5>): Vector5<B> {
    // prettier-ignore
    return new Vector5(prefix1, len1, prefix2, len12, prefix3, len123, prefix4, len1234, data5, suffix4, suffix3, suffix2, suffix1, len0);
  }

  public elem(idx: number): A {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len1234;
      if (idx >= 0) {
        const i5 = io >>> BITS4;
        const i4 = (io >>> BITS3) & MASK;
        const i3 = (io >>> BITS2) & MASK;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i5 < this.data5.length
          ? (this.data5[i5][i4][i3][i2][i1] as A)
          : i4 < this.suffix4.length
          ? (this.suffix4[i4][i3][i2][i1] as A)
          : i3 < this.suffix3.length
          ? (this.suffix3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? (this.suffix2[i2][i1] as A)
          : (this.suffix1[i1] as A);
      } else if (idx >= this.len123) {
        const io = idx - this.len123;
        // prettier-ignore
        return this.prefix4[io >>> BITS3][(io >>> BITS2) & MASK][(io >>> BITS) & MASK][io & MASK] as A;
      } else if (idx >= this.len12) {
        const io = idx - this.len12;
        return this.prefix3[io >>> BITS2][(io >>> BITS) & MASK][io & MASK] as A;
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return this.prefix2[io >>> BITS][io & MASK] as A;
      } else {
        return this.prefix1[idx] as A;
      }
    } else {
      return ioob(idx);
    }
  }

  public elemOption(idx: number): Option<A> {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len1234;
      if (idx >= 0) {
        const i5 = io >>> BITS4;
        const i4 = (io >>> BITS3) & MASK;
        const i3 = (io >>> BITS2) & MASK;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i5 < this.data5.length
          ? Some(this.data5[i5][i4][i3][i2][i1] as A)
          : i4 < this.suffix4.length
          ? Some(this.suffix4[i4][i3][i2][i1] as A)
          : i3 < this.suffix3.length
          ? Some(this.suffix3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? Some(this.suffix2[i2][i1] as A)
          : Some(this.suffix1[i1] as A);
      } else if (idx >= this.len123) {
        const io = idx - this.len123;
        // prettier-ignore
        return Some(this.prefix4[io >>> BITS3][(io >>> BITS2) & MASK][(io >>> BITS) & MASK][io & MASK] as A);
      } else if (idx >= this.len12) {
        const io = idx - this.len12;
        return Some(
          this.prefix3[io >>> BITS2][(io >>> BITS) & MASK][io & MASK] as A,
        );
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return Some(this.prefix2[io >>> BITS][io & MASK] as A);
      } else {
        return Some(this.prefix1[idx] as A);
      }
    } else {
      return None;
    }
  }

  public prepend<B>(this: Vector5<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.len1 < WIDTH
      ? this.copy({ prefix1: [that, ...this.prefix1], len1: this.len1 + 1, len12: this.len12 + 1, len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len12 < WIDTH2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [this.prefix1, ...this.prefix2], len12: this.len12 + 1, len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len123 < WIDTH3
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [[this.prefix1, ...this.prefix2], ...this.prefix3], len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len1234 < WIDTH4
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [], len123: 1, prefix4: [[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.prefix4], len1234: this.len1234 + 1, len0: this.len0 + 1 })
    : this.data5.length < WIDTH - 2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [], len123: 1, prefix4: [], len1234: 1, data5: [[[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.prefix4], ...this.data5], len0: this.len0 + 1 })
    : new Vector6(wrap1(that), 1, [], 1, [], 1, [], 1, wrap5([[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.prefix4]), this.len1234 + 1, [], this.data5, this.suffix4, this.suffix3, this.suffix2, this.suffix1, this.len0 + 1);
  }

  public append<B>(this: Vector5<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.suffix1.length < WIDTH
      ? this.copy({ suffix1: [...this.suffix1, that], len0: this.len0 + 1 })
    : this.suffix2.length < WIDTH - 1
      ? this.copy({ suffix2: [...this.suffix2, this.suffix1], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.suffix3.length < WIDTH - 1
      ? this.copy({ suffix3: [...this.suffix3, [...this.suffix2, this.suffix1]], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.suffix4.length < WIDTH - 1
      ? this.copy({ suffix4: [...this.suffix4, [...this.suffix3, [...this.suffix2, this.suffix1]]], suffix3: [], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.data5.length < WIDTH - 2
      ? this.copy({ data5: [...this.data5, [...this.suffix4, [...this.suffix3, [...this.suffix2, this.suffix1]]]], suffix4: [], suffix3: [], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : new Vector6(this.prefix1, this.len1, this.prefix2, this.len12, this.prefix3, this.len123, this.prefix4, this.len1234, this.data5, (WIDTH - 2) * WIDTH4 + this.len1234, [], wrap5([...this.suffix4, [...this.suffix3, [...this.suffix2, this.suffix1]]]), [], [], [], wrap1(that), this.len0 + 1);
  }

  public map<B>(f: (a: A) => B): Vector<B> {
    return this.copy({
      prefix1: mapElems1(this.prefix1, f),
      prefix2: mapElems(2, this.prefix2, f),
      prefix3: mapElems(3, this.prefix3, f),
      prefix4: mapElems(4, this.prefix4, f),
      data5: mapElems(5, this.data5, f),
      suffix4: mapElems(4, this.suffix4, f),
      suffix3: mapElems(3, this.suffix3, f),
      suffix2: mapElems(2, this.suffix2, f),
      suffix1: mapElems1(this.suffix1, f),
    });
  }

  protected slice0(lo: number, hi: number): Vector<A> {
    const builder = new VectorSliceBuilder<A>(lo, hi);
    return builder
      .consider(1, this.prefix1)
      .consider(2, this.prefix2)
      .consider(3, this.prefix3)
      .consider(4, this.prefix4)
      .consider(5, this.data5)
      .consider(4, this.suffix4)
      .consider(2, this.suffix2)
      .consider(1, this.suffix1)
      .toVector();
  }
}

export class Vector6<A> extends Vector<A> {
  public readonly tag = 6;
  // prettier-ignore
  public constructor(
    public readonly prefix1: Arr1, public readonly len1: number,
    public readonly prefix2: Arr2, public readonly len12: number,
    public readonly prefix3: Arr3, public readonly len123: number,
    public readonly prefix4: Arr4, public readonly len1234: number,
    public readonly prefix5: Arr5, public readonly len12345: number,
    public readonly data6: Arr6,
    public readonly suffix5: Arr5,
    public readonly suffix4: Arr4,
    public readonly suffix3: Arr3,
    public readonly suffix2: Arr2,
    public readonly suffix1: Arr1,
    public readonly len0: number,
  ) {
    super();
  }

  public get size(): number {
    return this.len0;
  }

  private copy<B>({
    prefix1 = this.prefix1,
    len1 = this.len1,
    prefix2 = this.prefix2,
    len12 = this.len12,
    prefix3 = this.prefix3,
    len123 = this.len123,
    prefix4 = this.prefix4,
    len1234 = this.len1234,
    prefix5 = this.prefix5,
    len12345 = this.len12345,
    data6 = this.data6,
    suffix5 = this.suffix5,
    suffix4 = this.suffix4,
    suffix3 = this.suffix3,
    suffix2 = this.suffix2,
    suffix1 = this.suffix1,
    len0 = this.len0,
  }: Partial<Props6>): Vector6<B> {
    // prettier-ignore
    return new Vector6(prefix1, len1, prefix2, len12, prefix3, len123, prefix4, len1234, prefix5, len12345, data6, suffix5, suffix4, suffix3, suffix2, suffix1, len0);
  }

  public elem(idx: number): A {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len12345;
      if (idx >= 0) {
        const i6 = io >>> BITS5;
        const i5 = (io >>> BITS4) & MASK;
        const i4 = (io >>> BITS3) & MASK;
        const i3 = (io >>> BITS2) & MASK;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i6 < this.data6.length
          ? (this.data6[i6][i5][i4][i3][i2][i1] as A)
          : i5 < this.suffix5.length
          ? (this.suffix5[i5][i4][i3][i2][i1] as A)
          : i4 < this.suffix4.length
          ? (this.suffix4[i4][i3][i2][i1] as A)
          : i3 < this.suffix3.length
          ? (this.suffix3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? (this.suffix2[i2][i1] as A)
          : (this.suffix1[i1] as A);
      } else if (idx >= this.len1234) {
        const io = idx - this.len1234;
        // prettier-ignore
        return this.prefix5[io >>> BITS4][(io >>> BITS3) & MASK][(io >>> BITS2) & MASK][(io >>> BITS) & MASK][io & MASK] as A;
      } else if (idx >= this.len123) {
        const io = idx - this.len123;
        // prettier-ignore
        return this.prefix4[io >>> BITS3][(io >>> BITS2) & MASK][(io >>> BITS) & MASK][io & MASK] as A;
      } else if (idx >= this.len12) {
        const io = idx - this.len12;
        return this.prefix3[io >>> BITS2][(io >>> BITS) & MASK][io & MASK] as A;
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return this.prefix2[io >>> BITS][io & MASK] as A;
      } else {
        return this.prefix1[idx] as A;
      }
    } else {
      return ioob(idx);
    }
  }

  public elemOption(idx: number): Option<A> {
    if (idx >= 0 && idx < this.len0) {
      const io = idx - this.len12345;
      if (idx >= 0) {
        const i6 = io >>> BITS5;
        const i5 = (io >>> BITS4) & MASK;
        const i4 = (io >>> BITS3) & MASK;
        const i3 = (io >>> BITS2) & MASK;
        const i2 = (io >>> BITS) & MASK;
        const i1 = io & MASK;
        return i6 < this.data6.length
          ? Some(this.data6[i6][i5][i4][i3][i2][i1] as A)
          : i5 < this.suffix5.length
          ? Some(this.suffix5[i5][i4][i3][i2][i1] as A)
          : i4 < this.suffix4.length
          ? Some(this.suffix4[i4][i3][i2][i1] as A)
          : i3 < this.suffix3.length
          ? Some(this.suffix3[i3][i2][i1] as A)
          : i2 < this.suffix2.length
          ? Some(this.suffix2[i2][i1] as A)
          : Some(this.suffix1[i1] as A);
      } else if (idx >= this.len1234) {
        const io = idx - this.len1234;
        // prettier-ignore
        return Some(this.prefix5[io >>> BITS4][(io >>> BITS3) & MASK][(io >>> BITS2) & MASK][(io >>> BITS) & MASK][io & MASK] as A);
      } else if (idx >= this.len123) {
        const io = idx - this.len123;
        // prettier-ignore
        return Some(this.prefix4[io >>> BITS3][(io >>> BITS2) & MASK][(io >>> BITS) & MASK][io & MASK] as A);
      } else if (idx >= this.len12) {
        const io = idx - this.len12;
        return Some(
          this.prefix3[io >>> BITS2][(io >>> BITS) & MASK][io & MASK] as A,
        );
      } else if (idx >= this.len1) {
        const io = idx - this.len1;
        return Some(this.prefix2[io >>> BITS][io & MASK] as A);
      } else {
        return Some(this.prefix1[idx] as A);
      }
    } else {
      return ioob(idx);
    }
  }

  public prepend<B>(this: Vector6<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.len1 < WIDTH
      ? this.copy({ prefix1: [that, ...this.prefix1], len1: this.len1 + 1, len12: this.len12 + 1, len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len12 < WIDTH2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [this.prefix1, ...this.prefix2], len12: this.len12 + 1, len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len123 < WIDTH3
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [[this.prefix1, ...this.prefix2], ...this.prefix3], len123: this.len123 + 1, len0: this.len0 + 1 })
    : this.len1234 < WIDTH4
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [], len123: 1, prefix4: [[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.prefix4], len1234: this.len1234 + 1, len0: this.len0 + 1 })
    : this.len1234 < WIDTH5
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [], len123: 1, prefix4: [], len1234: 1, prefix5: [[[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.prefix4], ...this.prefix5], len12345: this.len12345 + 1, len0: this.len0 + 1 })
    : this.data6.length < LASTWIDTH - 2
      ? this.copy({ prefix1: wrap1(that), len1: 1, prefix2: [], len12: 1, prefix3: [], len123: 1, prefix4: [], len1234: 1, prefix5: [], len12345: 1, data6: [[[[[this.prefix1, ...this.prefix2], ...this.prefix3], ...this.prefix4], ...this.prefix5], ...this.data6], len0: this.len0 + 1 })
    : throwError(new Error('Maximum vector size reached'));
  }

  public append<B>(this: Vector6<B>, that: B): Vector<B> {
    // prettier-ignore
    return this.suffix1.length < WIDTH
      ? this.copy({ suffix1: [...this.suffix1, that], len0: this.len0 + 1 })
    : this.suffix2.length < WIDTH - 1
      ? this.copy({ suffix2: [...this.suffix2, this.suffix1], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.suffix3.length < WIDTH - 1
      ? this.copy({ suffix3: [...this.suffix3, [...this.suffix2, this.suffix1]], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.suffix4.length < WIDTH - 1
      ? this.copy({ suffix4: [...this.suffix4, [...this.suffix3, [...this.suffix2, this.suffix1]]], suffix3: [], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.suffix5.length < WIDTH - 1
      ? this.copy({ suffix5: [...this.suffix5, [...this.suffix4, [...this.suffix3, [...this.suffix2, this.suffix1]]]], suffix4: [], suffix3: [], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : this.data6.length < LASTWIDTH - 2
      ? this.copy({ data6: [...this.data6, [...this.suffix5, [...this.suffix4, [...this.suffix3, [...this.suffix2, this.suffix1]]]]], suffix5: [], suffix4: [], suffix3: [], suffix2: [], suffix1: wrap1(that), len0: this.len0 + 1 })
    : throwError(new Error('Maximum vector size reached'))
  }

  public map<B>(f: (a: A) => B): Vector<B> {
    return this.copy({
      prefix1: mapElems1(this.prefix1, f),
      prefix2: mapElems(2, this.prefix2, f),
      prefix3: mapElems(3, this.prefix3, f),
      prefix4: mapElems(4, this.prefix4, f),
      prefix5: mapElems(5, this.prefix5, f),
      data6: mapElems(6, this.data6, f),
      suffix5: mapElems(5, this.suffix5, f),
      suffix4: mapElems(4, this.suffix4, f),
      suffix3: mapElems(3, this.suffix3, f),
      suffix2: mapElems(2, this.suffix2, f),
      suffix1: mapElems1(this.suffix1, f),
    });
  }

  protected slice0(lo: number, hi: number): Vector<A> {
    const builder = new VectorSliceBuilder<A>(lo, hi);
    return builder
      .consider(1, this.prefix1)
      .consider(2, this.prefix2)
      .consider(3, this.prefix3)
      .consider(4, this.prefix4)
      .consider(5, this.prefix5)
      .consider(6, this.data6)
      .consider(5, this.suffix5)
      .consider(2, this.suffix2)
      .consider(1, this.suffix1)
      .toVector();
  }
}

export type View<A> =
  | typeof Vector0
  | Vector1<A>
  | Vector2<A>
  | Vector3<A>
  | Vector4<A>
  | Vector5<A>
  | Vector6<A>;
function* iterator<A>(v: Vector<A>): Generator<A> {
  const vv = v as View<A>;
  switch (vv.tag) {
    case 0:
      return;
    case 1:
      yield* arrIterator(1, vv.data1);
      return;
    case 2:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.data2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 3:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.data3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 4:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.prefix3);
      yield* arrIterator(4, vv.data4);
      yield* arrIterator(3, vv.suffix3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 5:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.prefix3);
      yield* arrIterator(4, vv.prefix4);
      yield* arrIterator(5, vv.data5);
      yield* arrIterator(4, vv.suffix4);
      yield* arrIterator(3, vv.suffix3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
    case 6:
      yield* arrIterator(1, vv.prefix1);
      yield* arrIterator(2, vv.prefix2);
      yield* arrIterator(3, vv.prefix3);
      yield* arrIterator(4, vv.prefix4);
      yield* arrIterator(5, vv.prefix5);
      yield* arrIterator(6, vv.data6);
      yield* arrIterator(5, vv.suffix5);
      yield* arrIterator(4, vv.suffix4);
      yield* arrIterator(3, vv.suffix3);
      yield* arrIterator(2, vv.suffix2);
      yield* arrIterator(1, vv.suffix1);
      return;
  }
}

export function vectorSlice<A>(v: Vector<A>, idx: number): unknown[] {
  const vv = v as View<A>;
  switch (vv.tag) {
    case 0:
      throw new Error('Invalid slice');
    case 1:
      return vv.data1;
    case 2:
      switch (idx) {
        case 0:
          return vv.prefix1;
        case 1:
          return vv.data2;
        case 2:
          return vv.suffix1;
        default:
          throw new Error();
      }
    case 3:
      switch (idx) {
        case 0:
          return vv.prefix1;
        case 1:
          return vv.prefix2;
        case 2:
          return vv.data3;
        case 3:
          return vv.suffix2;
        case 4:
          return vv.suffix1;
        default:
          throw new Error();
      }
    case 4:
      switch (idx) {
        case 0:
          return vv.prefix1;
        case 1:
          return vv.prefix2;
        case 2:
          return vv.prefix3;
        case 3:
          return vv.data4;
        case 4:
          return vv.suffix3;
        case 5:
          return vv.suffix2;
        case 6:
          return vv.suffix1;
        default:
          throw new Error();
      }
    case 5:
      switch (idx) {
        case 0:
          return vv.prefix1;
        case 1:
          return vv.prefix2;
        case 2:
          return vv.prefix3;
        case 3:
          return vv.prefix4;
        case 4:
          return vv.data5;
        case 5:
          return vv.suffix4;
        case 6:
          return vv.suffix3;
        case 7:
          return vv.suffix2;
        case 8:
          return vv.suffix1;
        default:
          throw new Error();
      }
    case 6:
      switch (idx) {
        case 0:
          return vv.prefix1;
        case 1:
          return vv.prefix2;
        case 2:
          return vv.prefix3;
        case 3:
          return vv.prefix4;
        case 4:
          return vv.prefix5;
        case 5:
          return vv.data6;
        case 6:
          return vv.suffix5;
        case 7:
          return vv.suffix4;
        case 8:
          return vv.suffix3;
        case 9:
          return vv.suffix2;
        case 10:
          return vv.suffix1;
        default:
          throw new Error();
      }
  }
}

export function vectorSliceCount<A>(v: Vector<A>): number {
  const vv = v as View<A>;
  switch (vv.tag) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 5;
    case 4:
      return 7;
    case 5:
      return 9;
    case 6:
      return 11;
  }
}

type Props1 = {
  readonly data1: Arr1;
};
type Props2 = {
  readonly prefix1: Arr1;
  readonly len1: number;
  readonly data2: Arr2;
  readonly suffix1: Arr1;
  readonly len0: number;
};
type Props3 = {
  readonly prefix1: Arr1;
  readonly len1: number;
  readonly prefix2: Arr2;
  readonly len12: number;
  readonly data3: Arr3;
  readonly suffix2: Arr2;
  readonly suffix1: Arr1;
  readonly len0: number;
};
type Props4 = {
  readonly prefix1: Arr1;
  readonly len1: number;
  readonly prefix2: Arr2;
  readonly len12: number;
  readonly prefix3: Arr3;
  readonly len123: number;
  readonly data4: Arr4;
  readonly suffix3: Arr3;
  readonly suffix2: Arr2;
  readonly suffix1: Arr1;
  readonly len0: number;
};
type Props5 = {
  readonly prefix1: Arr1;
  readonly len1: number;
  readonly prefix2: Arr2;
  readonly len12: number;
  readonly prefix3: Arr3;
  readonly len123: number;
  readonly prefix4: Arr4;
  readonly len1234: number;
  readonly data5: Arr5;
  readonly suffix4: Arr4;
  readonly suffix3: Arr3;
  readonly suffix2: Arr2;
  readonly suffix1: Arr1;
  readonly len0: number;
};
type Props6 = {
  readonly prefix1: Arr1;
  readonly len1: number;
  readonly prefix2: Arr2;
  readonly len12: number;
  readonly prefix3: Arr3;
  readonly len123: number;
  readonly prefix4: Arr4;
  readonly len1234: number;
  readonly prefix5: Arr5;
  readonly len12345: number;
  readonly data6: Arr6;
  readonly suffix5: Arr5;
  readonly suffix4: Arr4;
  readonly suffix3: Arr3;
  readonly suffix2: Arr2;
  readonly suffix1: Arr1;
  readonly len0: number;
};
