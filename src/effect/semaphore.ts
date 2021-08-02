import { ok as assert } from 'assert';
import * as IO from './io';

class Semaphore {
  public constructor(private readonly maxPermits: number) {
    assert(maxPermits > 0, 'maxPermits must be > 0');
  }

  public aquire(): IO.IO<void> {}
}
