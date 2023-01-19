// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { BITS, WIDTH, WIDTH2, WIDTH3, WIDTH4, Arr1, Arr2 } from './constants';
import { copyOrUse } from './helpers';

import {
  Vector,
  Vector0,
  Vector1,
  Vector2,
  Vector3,
  Vector4,
  Vector5,
  Vector6,
} from './algebra';

export class VectorSliceBuilder<A> {
  private readonly slices: unknown[][] = new Array(11);
  private len: number = 0;
  private pos: number = 0;
  private maxDim: number = 0;

  private prefixIdx(n: number) {
    return n - 1;
  }
  private suffixIdx(n: number) {
    return 11 - n;
  }

  public constructor(
    private readonly lo: number,
    private readonly hi: number,
  ) {}

  public consider<T>(n: number, a: T[]): VectorSliceBuilder<A> {
    const count = a.length * (1 << (BITS * (n - 1)));
    const lo0 = Math.max(this.lo - this.pos, 0);
    const hi0 = Math.min(this.hi - this.pos, count);
    if (hi0 > lo0) {
      this.addSlice(n, a, lo0, hi0);
      this.len += hi0 - lo0;
    }
    this.pos += count;
    return this;
  }

  private addSlice<T>(n: number, a: T[], lo: number, hi: number): void {
    if (n == 1) {
      this.add(1, copyOrUse(a, lo, hi));
    } else {
      const bitsN = BITS * (n - 1);
      const widthN = 1 << bitsN;
      const loN = lo >>> bitsN;
      const hiN = hi >>> bitsN;
      const loRest = lo & (widthN - 1);
      const hiRest = hi & (widthN - 1);
      if (loRest == 0) {
        if (hiRest == 0) {
          this.add(n, copyOrUse(a, loN, hiN));
        } else {
          if (hiN > loN) this.add(n, copyOrUse(a, loN, hiN));
          this.addSlice(n - 1, a[hiN] as any as unknown[], 0, hiRest);
        }
      } else {
        if (hiN == loN) {
          this.addSlice(n - 1, a[loN] as any as unknown[], loRest, hiRest);
        } else {
          this.addSlice(n - 1, a[loN] as any as unknown[], loRest, widthN);
          if (hiRest == 0) {
            if (hiN > loN + 1) this.add(n, copyOrUse(a, loN + 1, hiN));
          } else {
            if (hiN > loN + 1) this.add(n, copyOrUse(a, loN + 1, hiN));
            this.addSlice(n - 1, a[hiN] as any as unknown[], 0, hiRest);
          }
        }
      }
    }
  }

  private add<T>(n: number, a: T[]): void {
    let idx: number;
    if (n <= this.maxDim) {
      idx = this.suffixIdx(n);
    } else {
      this.maxDim = n;
      idx = this.prefixIdx(n);
    }
    this.slices[idx] = a as any as unknown[];
  }

  public toVector(): Vector<A> {
    if (this.len <= 32) {
      if (this.len == 0) return Vector0;
      else {
        const prefix1 = this.slices[this.prefixIdx(1)];
        const suffix1 = this.slices[this.suffixIdx(1)];
        let a: Arr1;
        if (prefix1 != null) {
          if (suffix1 != null) {
            a = prefix1.concat(suffix1);
          } else {
            a = prefix1;
          }
        } else if (suffix1 != null) {
          a = suffix1;
        } else {
          const prefix2 = this.slices[this.prefixIdx(2)] as Arr2;
          if (prefix2 != null) {
            a = prefix2[0];
          } else {
            const suffix2 = this.slices[this.suffixIdx(2)] as Arr2;
            a = suffix2[0];
          }
        }
        return new Vector1(a);
      }
    } else {
      this.balancePrefix(1);
      this.balanceSuffix(1);
      let resultDim = this.maxDim;
      if (resultDim < 6) {
        const pre = this.slices[this.prefixIdx(this.maxDim)];
        const suf = this.slices[this.suffixIdx(this.maxDim)];
        if (pre != null && suf != null) {
          // The highest-dimensional data consists of two slices: concatenate if they fit into the main data array,
          // otherwise increase the dimension
          if (pre.length + suf.length <= WIDTH - 2) {
            this.slices[this.prefixIdx(this.maxDim)] = pre.concat(suf);
            this.slices[this.suffixIdx(this.maxDim)] = undefined as any;
          } else resultDim += 1;
        } else {
          // A single highest-dimensional slice could have length WIDTH-1 if it came from a prefix or suffix but we
          // only allow WIDTH-2 for the main data, so increase the dimension in this case
          const one = pre != null ? pre : suf;
          if (one.length > WIDTH - 2) resultDim += 1;
        }
      }
      const prefix1 = this.slices[this.prefixIdx(1)];
      const suffix1 = this.slices[this.suffixIdx(1)];
      const len1 = prefix1.length;
      switch (resultDim) {
        case 2: {
          const data2 = this.dataOr(2, []);
          return new Vector2(prefix1, len1, data2, suffix1, this.len);
        }
        case 3: {
          const prefix2 = this.prefixOr(2, []);
          const data3 = this.dataOr(3, []);
          const suffix2 = this.suffixOr(2, []);
          const len12 = len1 + prefix2.length * WIDTH;
          // prettier-ignore
          return new Vector3(prefix1, len1, prefix2, len12, data3, suffix2, suffix1, this.len);
        }
        case 4: {
          const prefix2 = this.prefixOr(2, []);
          const prefix3 = this.prefixOr(3, []);
          const data4 = this.dataOr(4, []);
          const suffix3 = this.suffixOr(3, []);
          const suffix2 = this.suffixOr(2, []);
          const len12 = len1 + prefix2.length * WIDTH;
          const len123 = len12 + prefix3.length * WIDTH2;
          // prettier-ignore
          return new Vector4(prefix1, len1, prefix2, len12, prefix3, len123, data4, suffix3, suffix2, suffix1, this.len);
        }
        case 5: {
          const prefix2 = this.prefixOr(2, []);
          const prefix3 = this.prefixOr(3, []);
          const prefix4 = this.prefixOr(4, []);
          const data5 = this.dataOr(5, []);
          const suffix4 = this.suffixOr(4, []);
          const suffix3 = this.suffixOr(3, []);
          const suffix2 = this.suffixOr(2, []);
          const len12 = len1 + prefix2.length * WIDTH;
          const len123 = len12 + prefix3.length * WIDTH2;
          const len1234 = len123 + prefix4.length * WIDTH3;
          // prettier-ignore
          return new Vector5(prefix1, len1, prefix2, len12, prefix3, len123, prefix4, len1234, data5, suffix4, suffix3, suffix2, suffix1, this.len);
        }
        case 6: {
          const prefix2 = this.prefixOr(2, []);
          const prefix3 = this.prefixOr(3, []);
          const prefix4 = this.prefixOr(4, []);
          const prefix5 = this.prefixOr(5, []);
          const data6 = this.dataOr(6, []);
          const suffix5 = this.suffixOr(5, []);
          const suffix4 = this.suffixOr(4, []);
          const suffix3 = this.suffixOr(3, []);
          const suffix2 = this.suffixOr(2, []);
          const len12 = len1 + prefix2.length * WIDTH;
          const len123 = len12 + prefix3.length * WIDTH2;
          const len1234 = len123 + prefix4.length * WIDTH3;
          const len12345 = len1234 + prefix5.length * WIDTH4;
          // prettier-ignore
          return new Vector6(prefix1, len1, prefix2, len12, prefix3, len123, prefix4, len1234, prefix5, len12345, data6, suffix5, suffix4, suffix3, suffix2, suffix1, this.len);
        }
        default:
          throw new Error();
      }
    }
  }

  private prefixOr<T>(n: number, a: T[]): T[] {
    const p = this.slices[this.prefixIdx(n)];
    return p != null ? (p as any as T[]) : a;
  }

  private suffixOr<T>(n: number, a: T[]): T[] {
    const s = this.slices[this.suffixIdx(n)];
    return s != null ? (s as any as T[]) : a;
  }

  private dataOr<T>(n: number, a: T[]): T[] {
    const p = this.slices[this.prefixIdx(n)];
    if (p != null) return p as any as T[];
    else {
      const s = this.slices[this.suffixIdx(n)];
      return s != null ? (s as any as T[]) : a;
    }
  }

  /** Ensure prefix is not empty */
  private balancePrefix(n: number): void {
    if (this.slices[this.prefixIdx(n)] == null) {
      if (n === this.maxDim) {
        this.slices[this.prefixIdx(n)] = this.slices[this.suffixIdx(n)];
        this.slices[this.suffixIdx(n)] = undefined as any;
      } else {
        this.balancePrefix(n + 1);
        const preN1 = this.slices[this.prefixIdx(n + 1)] as unknown[][];
        this.slices[this.prefixIdx(n)] = preN1[0];
        if (preN1.length === 1) {
          this.slices[this.prefixIdx(n + 1)] = undefined as any;
          if (
            this.maxDim === n + 1 &&
            this.slices[this.suffixIdx(n + 1)] == null
          )
            this.maxDim = n;
        } else {
          this.slices[this.prefixIdx(n + 1)] = preN1.slice(1, preN1.length);
        }
      }
    }
  }

  /** Ensure suffix is not empty */
  private balanceSuffix(n: number): void {
    if (this.slices[this.suffixIdx(n)] == null) {
      if (n === this.maxDim) {
        this.slices[this.suffixIdx(n)] = this.slices[this.prefixIdx(n)];
        this.slices[this.prefixIdx(n)] = undefined as any;
      } else {
        this.balanceSuffix(n + 1);
        const sufN1 = this.slices[this.suffixIdx(n + 1)] as unknown[][];
        this.slices[this.suffixIdx(n)] = sufN1[sufN1.length - 1];
        if (sufN1.length === 1) {
          this.slices[this.suffixIdx(n + 1)] = undefined as any;
          if (
            this.maxDim === n + 1 &&
            this.slices[this.prefixIdx(n + 1)] == null
          )
            this.maxDim = n;
        } else {
          this.slices[this.suffixIdx(n + 1)] = sufN1.slice(0, sufN1.length - 1);
        }
      }
    }
  }
}
