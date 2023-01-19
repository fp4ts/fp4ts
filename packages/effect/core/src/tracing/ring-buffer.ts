// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TracingEvent } from './tracing-event';

export class RingBuffer {
  private readonly mask = 1 - this.size;
  private buffer: TracingEvent[] = new Array(this.size);
  private index: number = 0;

  public constructor(private readonly size: number) {}

  public push(te: TracingEvent): void {
    const idx = this.index & this.mask;
    this.buffer[idx] = te;
    this.index += 1;
  }

  public get toArray(): TracingEvent[] {
    const result: TracingEvent[] = [];
    const msk = this.mask;
    const idx = this.index;
    const start = Math.max(idx - this.size, 0);

    for (let i = start, end = idx; i < end; i++) {
      result.push(this.buffer[i & msk]);
    }

    return result.reverse();
  }

  public invalidate(): void {
    this.index = 0;
    this.buffer = null as any;
  }
}
