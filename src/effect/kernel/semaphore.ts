import { ok as assert } from 'assert';
import { Ref } from './ref';
import { Deferred } from './deferred';
import { IO } from '../io';

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

  public readonly acquire = (): IO<void> =>
    IO.uncancelable(poll =>
      Deferred.of<void>().flatMap(wait => {
        const cancel = this.state.update(state =>
          state.copy({ queue: state.queue.filter(x => x !== wait) }),
        );

        return this.state.modify(state =>
          state.permits === 0
            ? [
                state.copy({ queue: [...state.queue, wait] }),
                poll(wait.get()).onCancel(cancel),
              ]
            : [state.copy({ permits: state.permits - 1 }), IO.unit],
        ).flatten;
      }),
    );

  public readonly release = (): IO<void> =>
    IO.uncancelable(
      () =>
        this.state.modify(state => {
          if (state.queue.length) {
            const [head, ...tail] = state.queue;
            return [state.copy({ queue: tail }), head.complete(undefined)];
          } else {
            return [state.copy({ permits: state.permits + 1 }), IO.unit];
          }
        }).flatten,
    );

  public readonly withPermit = <A>(ioa: IO<A>): IO<A> =>
    IO.uncancelable(poll =>
      poll(this.acquire())['>>>'](poll(ioa).finalize(() => this.release())),
    );

  public static readonly withPermits = (permits: number): IO<Semaphore> => {
    assert(permits > 0, 'maxPermits must be > 0');
    return Ref.of(new State([], permits)).map(state => new Semaphore(state));
  };
}

export const of = (permits: number): IO<Semaphore> =>
  Semaphore.withPermits(permits);

export const acquire: (sem: Semaphore) => IO<void> = sem => sem.acquire();

export const release: (sem: Semaphore) => IO<void> = sem => sem.release();

export const withPermit: (sem: Semaphore) => <A>(ioa: IO<A>) => IO<A> =
  sem => ioa =>
    withPermit_(sem, ioa);

export const withPermit_: <A>(sem: Semaphore, ioa: IO<A>) => IO<A> = (
  sem,
  ioa,
) => sem.withPermit(ioa);
