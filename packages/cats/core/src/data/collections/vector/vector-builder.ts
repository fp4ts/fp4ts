// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Vector,
  Vector0,
  Vector1,
  Vector2,
  Vector3,
  Vector4,
  Vector5,
  Vector6,
  View,
} from './algebra';
import {
  Arr1,
  Arr2,
  Arr3,
  Arr4,
  Arr5,
  Arr6,
  BITS,
  BITS2,
  BITS3,
  BITS4,
  BITS5,
  LASTWIDTH,
  MASK,
  WIDTH,
  WIDTH2,
  WIDTH3,
  WIDTH4,
  WIDTH5,
  WIDTH6,
} from './constants';
import {
  arrayCopy,
  copyIfDifferentSize,
  copyOf,
  copyOrUse,
  vectorSliceDim,
  arrIterator,
  vectorSliceCount,
} from './helpers';

export class VectorBuilder<A> {
  private a6: Arr6 = undefined as any;
  private a5: Arr5 = undefined as any;
  private a4: Arr4 = undefined as any;
  private a3: Arr3 = undefined as any;
  private a2: Arr2 = undefined as any;
  private a1: Arr1 = new Array(WIDTH);
  private len1: number = 0;
  private lenRest: number = 0;
  private offset: number = 0;
  private depth = 1;

  private setLength(i: number): void {
    this.len1 = i & MASK;
    this.lenRest = i - this.len1;
  }

  public initFromVector<A>(v: Vector<A>): this {
    const vv = v as View<A>;
    switch (vv.tag) {
      case 0:
        break;
      case 1: {
        const v1 = v as Vector1<A>;
        this.depth = 1;
        this.setLength(v1.data1.length);
        this.a1 = copyOrUse(v1.data1, 0, WIDTH);
        break;
      }
      case 2: {
        const v2 = v as Vector2<A>;
        const d2 = v2.data2;
        this.a1 = copyOrUse(v2.suffix1, 0, WIDTH);
        this.depth = 2;
        this.offset = WIDTH - v2.len1;
        this.setLength(v2.len0 + this.offset);
        this.a2 = new Array(WIDTH);
        this.a2[0] = v2.prefix1;
        arrayCopy(d2, 0, this.a2, 1, d2.length);
        this.a2[d2.length + 1] = this.a1;
        break;
      }
      case 3: {
        const v3 = v as Vector3<A>;
        const d3 = v3.data3;
        const s2 = v3.suffix2;
        this.a1 = copyOrUse(v3.suffix1, 0, WIDTH);
        this.depth = 3;
        this.offset = WIDTH2 - v3.len12;
        this.setLength(v3.len0 + this.offset);
        this.a3 = new Array(WIDTH);
        this.a3[0] = [v3.prefix1, ...v3.prefix2];
        arrayCopy(d3, 0, this.a3, 1, d3.length);
        this.a2 = copyOf(s2, WIDTH);
        this.a3[d3.length + 1] = this.a2;
        this.a2[s2.length] = this.a1;
        break;
      }
      case 4: {
        const v4 = v as Vector4<A>;
        const d4 = v4.data4;
        const s3 = v4.suffix3;
        const s2 = v4.suffix2;
        this.a1 = copyOrUse(v4.suffix1, 0, WIDTH);
        this.depth = 4;
        this.offset = WIDTH3 - v4.len123;
        this.setLength(v4.len0 + this.offset);
        this.a4 = new Array(WIDTH);
        this.a4[0] = [[v4.prefix1, ...v4.prefix2], ...v4.prefix3];
        arrayCopy(d4, 0, this.a4, 1, d4.length);
        this.a3 = copyOf(s3, WIDTH);
        this.a2 = copyOf(s2, WIDTH);
        this.a4[d4.length + 1] = this.a3;
        this.a3[s3.length] = this.a2;
        this.a2[s2.length] = this.a1;
        break;
      }
      case 5: {
        const v5 = v as Vector5<A>;
        const d5 = v5.data5;
        const s4 = v5.suffix4;
        const s3 = v5.suffix3;
        const s2 = v5.suffix2;
        this.a1 = copyOrUse(v5.suffix1, 0, WIDTH);
        this.depth = 5;
        this.offset = WIDTH4 - v5.len1234;
        this.setLength(v5.len0 + this.offset);
        this.a5 = new Array(WIDTH);
        this.a5[0] = [
          [[v5.prefix1, ...v5.prefix2], ...v5.prefix3],
          ...v5.prefix4,
        ];
        arrayCopy(d5, 0, this.a5, 1, d5.length);
        this.a4 = copyOf(s4, WIDTH);
        this.a3 = copyOf(s3, WIDTH);
        this.a2 = copyOf(s2, WIDTH);
        this.a5[d5.length + 1] = this.a4;
        this.a4[s4.length] = this.a3;
        this.a3[s3.length] = this.a2;
        this.a2[s2.length] = this.a1;
        break;
      }
      case 6: {
        const v6 = v as Vector6<A>;
        const d6 = v6.data6;
        const s5 = v6.suffix5;
        const s4 = v6.suffix4;
        const s3 = v6.suffix3;
        const s2 = v6.suffix2;
        this.a1 = copyOrUse(v6.suffix1, 0, WIDTH);
        this.depth = 6;
        this.offset = WIDTH5 - v6.len12345;
        this.setLength(v6.len0 + this.offset);
        this.a6 = new Array(WIDTH);
        this.a6[0] = [
          [[[v6.prefix1, ...v6.prefix2], ...v6.prefix3], ...v6.prefix4],
          ...v6.prefix5,
        ];
        arrayCopy(d6, 0, this.a6, 1, d6.length);
        this.a5 = copyOf(s5, WIDTH);
        this.a4 = copyOf(s4, WIDTH);
        this.a3 = copyOf(s3, WIDTH);
        this.a2 = copyOf(s2, WIDTH);
        this.a6[d6.length + 1] = this.a5;
        this.a5[s5.length] = this.a4;
        this.a4[s4.length] = this.a3;
        this.a3[s3.length] = this.a2;
        this.a2[s2.length] = this.a1;
        break;
      }
    }
    if (this.len1 === 0 && this.lenRest > 0) {
      // force advance() on next addition:
      this.len1 = WIDTH;
      this.lenRest -= WIDTH;
    }
    return this;
  }

  public addOne(elem: A): this {
    if (this.len1 === WIDTH) this.advance();
    this.a1[this.len1] = elem;
    this.len1 += 1;
    return this;
  }

  public addVector(xs: Vector<A>): this {
    const sliceCount = vectorSliceCount(xs);
    for (let sliceIdx = 0; sliceIdx < sliceCount; sliceIdx++) {
      const slice = vectorSlice(xs, sliceIdx);
      const dim = vectorSliceDim(sliceCount, sliceIdx);
      if (dim === 1) {
        this.addArr1(slice);
      } else {
        for (const x of arrIterator(dim - 1, slice)) {
          this.addArr1(x as Arr1);
        }
      }
    }

    return this;
  }

  public addIterator(iter: Iterator<A>): this {
    for (let i = iter.next(); !i.done; i = iter.next()) {
      this.addOne(i.value);
    }
    return this;
  }

  private addArr1(data: Arr1): void {
    const dl = data.length;
    if (dl > 0) {
      if (this.len1 === WIDTH) this.advance();
      const copy1 = Math.min(WIDTH - this.len1, dl);
      const copy2 = dl - copy1;
      arrayCopy(data, 0, this.a1, this.len1, copy1);
      this.len1 += copy1;
      if (copy2 > 0) {
        this.advance();
        arrayCopy(data, copy1, this.a1, 0, copy2);
        this.len1 += copy2;
      }
    }
  }

  private advance(): void {
    const idx = this.lenRest + WIDTH;
    const xor = idx ^ this.lenRest;
    this.lenRest = idx;
    this.len1 = 0;
    this.advance1(idx, xor);
  }

  private advance1(idx: number, xor: number): void {
    if (xor < WIDTH2) {
      // level = 1
      if (this.depth === 1) {
        this.a2 = new Array(WIDTH);
        this.a2[0] = this.a1;
        this.depth += 1;
      }
      this.a1 = new Array(WIDTH);
      this.a2[(idx >>> BITS) & MASK] = this.a1;
    } else if (xor < WIDTH3) {
      // level = 2
      if (this.depth === 2) {
        this.a3 = new Array(WIDTH);
        this.a3[0] = this.a2;
        this.depth += 1;
      }
      this.a1 = new Array(WIDTH);
      this.a2 = new Array(WIDTH);
      this.a2[(idx >>> BITS) & MASK] = this.a1;
      this.a3[(idx >>> BITS2) & MASK] = this.a2;
    } else if (xor < WIDTH4) {
      // level = 3
      if (this.depth === 3) {
        this.a4 = new Array(WIDTH);
        this.a4[0] = this.a3;
        this.depth += 1;
      }
      this.a1 = new Array(WIDTH);
      this.a2 = new Array(WIDTH);
      this.a3 = new Array(WIDTH);
      this.a2[(idx >>> BITS) & MASK] = this.a1;
      this.a3[(idx >>> BITS2) & MASK] = this.a2;
      this.a4[(idx >>> BITS3) & MASK] = this.a3;
    } else if (xor < WIDTH5) {
      // level = 4
      if (this.depth === 4) {
        this.a5 = new Array(WIDTH);
        this.a5[0] = this.a4;
        this.depth += 1;
      }
      this.a1 = new Array(WIDTH);
      this.a2 = new Array(WIDTH);
      this.a3 = new Array(WIDTH);
      this.a4 = new Array(WIDTH);
      this.a2[(idx >>> BITS) & MASK] = this.a1;
      this.a3[(idx >>> BITS2) & MASK] = this.a2;
      this.a4[(idx >>> BITS3) & MASK] = this.a3;
      this.a5[(idx >>> BITS4) & MASK] = this.a4;
    } else if (xor < WIDTH6) {
      // level = 5
      if (this.depth === 5) {
        this.a6 = new Array(LASTWIDTH);
        this.a6[0] = this.a5;
        this.depth += 1;
      }
      this.a1 = new Array(WIDTH);
      this.a2 = new Array(WIDTH);
      this.a3 = new Array(WIDTH);
      this.a4 = new Array(WIDTH);
      this.a5 = new Array(WIDTH);
      this.a2[(idx >>> BITS) & MASK] = this.a1;
      this.a3[(idx >>> BITS2) & MASK] = this.a2;
      this.a4[(idx >>> BITS3) & MASK] = this.a3;
      this.a5[(idx >>> BITS4) & MASK] = this.a4;
      this.a6[(idx >>> BITS5) & MASK] = this.a5;
    } else {
      // level = 6
      throw new Error(
        `advance1(${idx}, ${xor}): a1=${this.a1}, a2=${this.a2}, a3=${this.a3}, a4=${this.a4}, a5=${this.a5}, a6=${this.a6}, depth=${this.depth}`,
      );
    }
  }

  public get toVector(): Vector<A> {
    const len = this.len1 + this.lenRest;
    const realLen = len - this.offset;
    if (realLen === 0) return Vector0;
    else if (len <= WIDTH) {
      if (realLen === WIDTH) return new Vector1(this.a1);
      else return new Vector1(copyOf(this.a1, realLen));
    } else if (len <= WIDTH2) {
      const i1 = (len - 1) & MASK;
      const i2 = (len - 1) >>> BITS;
      const data = this.a2.slice(1, i2);
      const prefix1 = this.a2[0];
      const suffix1 = copyIfDifferentSize(this.a2[i2], i1 + 1);
      return new Vector2(prefix1, WIDTH - this.offset, data, suffix1, realLen);
    } else if (len <= WIDTH3) {
      const i1 = (len - 1) & MASK;
      const i2 = ((len - 1) >>> BITS) & MASK;
      const i3 = (len - 1) >>> BITS2;
      const data = this.a3.slice(1, i3);
      const prefix2 = this.a3[0].slice(1);
      const prefix1 = this.a3[0][0];
      const suffix2 = copyOf(this.a3[i3], i2);
      const suffix1 = copyIfDifferentSize(this.a3[i3][i2], i1 + 1);
      const len1 = prefix1.length;
      const len12 = len1 + prefix2.length * WIDTH;
      // prettier-ignore
      return new Vector3(prefix1, len1, prefix2, len12, data, suffix2, suffix1, realLen)
    } else if (len <= WIDTH4) {
      const i1 = (len - 1) & MASK;
      const i2 = ((len - 1) >>> BITS) & MASK;
      const i3 = ((len - 1) >>> BITS2) & MASK;
      const i4 = (len - 1) >>> BITS3;
      const data = this.a4.slice(1, i4);
      const prefix3 = this.a4[0].slice(1);
      const prefix2 = this.a4[0][0].slice(1);
      const prefix1 = this.a4[0][0][0];
      const suffix3 = copyOf(this.a4[i4], i3);
      const suffix2 = copyOf(this.a4[i4][i3], i2);
      const suffix1 = copyIfDifferentSize(this.a4[i4][i3][i2], i1 + 1);
      const len1 = prefix1.length;
      const len12 = len1 + prefix2.length * WIDTH;
      const len123 = len12 + prefix3.length * WIDTH2;
      // prettier-ignore
      return new Vector4(prefix1, len1, prefix2, len12, prefix3, len123, data, suffix3, suffix2, suffix1, realLen)
    } else if (len <= WIDTH5) {
      const i1 = (len - 1) & MASK;
      const i2 = ((len - 1) >>> BITS) & MASK;
      const i3 = ((len - 1) >>> BITS2) & MASK;
      const i4 = ((len - 1) >>> BITS3) & MASK;
      const i5 = (len - 1) >>> BITS4;
      const data = this.a5.slice(1, i5);
      const prefix4 = this.a5[0].slice(1);
      const prefix3 = this.a5[0][0].slice(1);
      const prefix2 = this.a5[0][0][0].slice(1);
      const prefix1 = this.a5[0][0][0][0];
      const suffix4 = copyOf(this.a5[i5], i4);
      const suffix3 = copyOf(this.a5[i5][i4], i3);
      const suffix2 = copyOf(this.a5[i5][i4][i3], i2);
      const suffix1 = copyIfDifferentSize(this.a5[i5][i4][i3][i2], i1 + 1);
      const len1 = prefix1.length;
      const len12 = len1 + prefix2.length * WIDTH;
      const len123 = len12 + prefix3.length * WIDTH2;
      const len1234 = len123 + prefix4.length * WIDTH3;
      // prettier-ignore
      return new Vector5(prefix1, len1, prefix2, len12, prefix3, len123, prefix4, len1234, data, suffix4, suffix3, suffix2, suffix1, realLen);
    } else {
      const i1 = (len - 1) & MASK;
      const i2 = ((len - 1) >>> BITS) & MASK;
      const i3 = ((len - 1) >>> BITS2) & MASK;
      const i4 = ((len - 1) >>> BITS3) & MASK;
      const i5 = ((len - 1) >>> BITS4) & MASK;
      const i6 = (len - 1) >>> BITS5;
      const data = this.a6.slice(1, i6);
      const prefix5 = this.a6[0].slice(1);
      const prefix4 = this.a6[0][0].slice(1);
      const prefix3 = this.a6[0][0][0].slice(1);
      const prefix2 = this.a6[0][0][0][0].slice(1);
      const prefix1 = this.a6[0][0][0][0][0];
      const suffix5 = copyOf(this.a6[i6], i5);
      const suffix4 = copyOf(this.a6[i6][i5], i4);
      const suffix3 = copyOf(this.a6[i6][i5][i4], i3);
      const suffix2 = copyOf(this.a6[i6][i5][i4][i3], i2);
      const suffix1 = copyIfDifferentSize(this.a6[i6][i5][i4][i3][i2], i1 + 1);
      const len1 = prefix1.length;
      const len12 = len1 + prefix2.length * WIDTH;
      const len123 = len12 + prefix3.length * WIDTH2;
      const len1234 = len123 + prefix4.length * WIDTH3;
      const len12345 = len1234 + prefix5.length * WIDTH4;
      // prettier-ignore
      return new Vector6(prefix1, len1, prefix2, len12, prefix3, len123, prefix4, len1234, prefix5, len12345, data, suffix5, suffix4, suffix3, suffix2, suffix1, realLen);
    }
  }
}

function vectorSlice<A>(v: Vector<A>, idx: number): unknown[] {
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
