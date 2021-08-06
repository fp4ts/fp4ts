import { ok as assert } from 'assert';
import { Ref } from './ref';
import { Deferred } from './deferred';
import * as IO from './io';
import { pipe } from '../fp/core';

class State {
  // @ts-ignore
  private readonly __void: void;

  public constructor(
    public readonly queue: Deferred<void>[],
    public readonly permits: number,
  ) {}

  public readonly copy = ({
    queue = this.queue,
    permits = this.permits,
  }: { queue?: Deferred<void>[]; permits?: number } = {}): State =>
    new State(queue, permits);
}

export class Semaphore {
  // @ts-ignore
  private readonly __void: void;

  private constructor(private readonly state: Ref<State>) {}

  public readonly acquire = (): IO.IO<void> =>
    IO.uncancelable(poll =>
      pipe(
        Deferred.of<void>(),
        IO.flatMap(wait => {
          const cancel = this.state.update(state =>
            state.copy({ queue: state.queue.filter(x => x !== wait) }),
          );

          return pipe(
            this.state.modify(state =>
              state.permits === 0
                ? [
                    state.copy({ queue: [...state.queue, wait] }),
                    IO.onCancel_(poll(wait.get()), cancel),
                  ]
                : [state.copy({ permits: state.permits - 1 }), IO.unit],
            ),
            IO.flatten,
          );
        }),
      ),
    );

  public readonly release = (): IO.IO<void> =>
    IO.uncancelable(() =>
      pipe(
        this.state.modify(state => {
          if (state.queue.length) {
            const [head, ...tail] = state.queue;
            return [state.copy({ queue: tail }), head.complete(undefined)];
          } else {
            return [state.copy({ permits: state.permits + 1 }), IO.unit];
          }
        }),
        IO.flatten,
      ),
    );

  public readonly withPermit = <A>(ioa: IO.IO<A>): IO.IO<A> =>
    IO.bracket_(
      this.acquire(),
      () => ioa,
      () => this.release(),
    );

  public static readonly withPermits = (permits: number): IO.IO<Semaphore> => {
    assert(permits > 0, 'maxPermits must be > 0');
    return pipe(
      Ref.of(new State([], permits)),
      IO.map(state => new Semaphore(state)),
    );
  };
}

export const of = (permits: number): IO.IO<Semaphore> =>
  Semaphore.withPermits(permits);

export const acquire: (sem: Semaphore) => IO.IO<void> = sem => sem.acquire();

export const release: (sem: Semaphore) => IO.IO<void> = sem => sem.release();

export const withPermit: (sem: Semaphore) => <A>(ioa: IO.IO<A>) => IO.IO<A> =
  sem => ioa =>
    withPermit_(ioa, sem);

export const withPermit_: <A>(ioa: IO.IO<A>, sem: Semaphore) => IO.IO<A> = (
  ioa,
  sem,
) => sem.withPermit(ioa);
