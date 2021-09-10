import { ok as assert } from 'assert';
import { Auto, Kind, Kind1, pipe, URIS } from '../../core';

import { Ref } from './ref';
import { Deferred } from './deferred';
import { Async } from './async';

class State<F extends URIS> {
  // @ts-ignore
  private readonly __void: void;

  public constructor(
    public readonly queue: Deferred<F, void>[],
    public readonly permits: number,
  ) {}

  public readonly copy = ({
    queue = this.queue,
    permits = this.permits,
  }: { queue?: Deferred<F, void>[]; permits?: number } = {}): State<F> =>
    new State(queue, permits);
}

export class Semaphore<F extends URIS, C = Auto> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(
    private readonly F: Async<F, C>,
    private readonly state: Ref<F, State<F>, C>,
  ) {}

  public readonly acquire = (): Kind1<F, C, void> =>
    this.F.uncancelable(poll =>
      pipe(
        Deferred.of(this.F)<void>(),
        this.F.flatMap(wait => {
          const cancel = this.state.update(state =>
            state.copy({ queue: state.queue.filter(x => x !== wait) }),
          );

          return this.state.modify(state =>
            state.permits === 0
              ? [
                  state.copy({ queue: [...state.queue, wait] }),
                  pipe(poll(wait.get()), this.F.onCancel(cancel)),
                ]
              : [state.copy({ permits: state.permits - 1 }), this.F.unit()],
          );
        }),
        this.F.flatten,
      ),
    );

  public readonly release = (): Kind1<F, C, void> =>
    this.F.uncancelable(() =>
      pipe(
        this.state.modify(state => {
          if (state.queue.length) {
            const [head, ...tail] = state.queue;
            return [state.copy({ queue: tail }), head.complete(undefined)];
          } else {
            return [state.copy({ permits: state.permits + 1 }), this.F.unit()];
          }
        }),
        this.F.flatten,
      ),
    );

  public readonly withPermit = <A>(fa: Kind1<F, C, A>): Kind1<F, C, A> =>
    this.F.uncancelable(poll =>
      pipe(
        poll(this.acquire()),
        this.F.flatMap(() =>
          pipe(
            poll(fa),
            this.F.finalize(() => this.release()),
          ),
        ),
      ),
    );

  public static readonly withPermits =
    <F extends URIS, C>(F: Async<F, C>) =>
    (permits: number): Kind1<F, C, Semaphore<F>> => {
      assert(permits > 0, 'maxPermits must be > 0');
      return pipe(
        Ref.of(F)(new State<F>([], permits)),
        F.map(state => new Semaphore(F, state)),
      );
    };
}

export const of =
  <F extends URIS, C>(F: Async<F, C>) =>
  (permits: number): Kind1<F, C, Semaphore<F, C>> =>
    Semaphore.withPermits(F)(permits);

export const acquire: <F extends URIS, C>(
  sem: Semaphore<F, C>,
) => Kind1<F, C, void> = sem => sem.acquire();

export const release: <F extends URIS, C>(
  sem: Semaphore<F, C>,
) => Kind1<F, C, void> = sem => sem.release();

export const withPermit: <F extends URIS, C>(
  sem: Semaphore<F, C>,
) => <A>(fa: Kind1<F, C, A>) => Kind1<F, C, A> = sem => fa =>
  withPermit_(sem, fa);

export const withPermit_: <F extends URIS, C, A>(
  sem: Semaphore<F, C>,
  fa: Kind1<F, C, A>,
) => Kind1<F, C, A> = (sem, fa) => sem.withPermit(fa);
