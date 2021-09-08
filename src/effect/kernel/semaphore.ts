import { ok as assert } from 'assert';
import { Kind } from '../../fp/hkt';
import { pipe } from '../../fp/core';

import { Ref } from './ref';
import { Deferred } from './deferred';
import { Async } from './async';

class State<F> {
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

export class Semaphore<F> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(
    private readonly F: Async<F>,
    private readonly state: Ref<F, State<F>>,
  ) {}

  public readonly acquire = (): Kind<F, void> =>
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
              : [state.copy({ permits: state.permits - 1 }), this.F.unit],
          );
        }),
        this.F.flatten,
      ),
    );

  public readonly release = (): Kind<F, void> =>
    this.F.uncancelable(() =>
      pipe(
        this.state.modify(state => {
          if (state.queue.length) {
            const [head, ...tail] = state.queue;
            return [state.copy({ queue: tail }), head.complete(undefined)];
          } else {
            return [state.copy({ permits: state.permits + 1 }), this.F.unit];
          }
        }),
        this.F.flatten,
      ),
    );

  public readonly withPermit = <A>(fa: Kind<F, A>): Kind<F, A> =>
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
    <F>(F: Async<F>) =>
    (permits: number): Kind<F, Semaphore<F>> => {
      assert(permits > 0, 'maxPermits must be > 0');
      return pipe(
        Ref.of(F)(new State<F>([], permits)),
        F.map(state => new Semaphore(F, state)),
      );
    };
}

export const of =
  <F>(F: Async<F>) =>
  (permits: number): Kind<F, Semaphore<F>> =>
    Semaphore.withPermits(F)(permits);

export const acquire: <F>(sem: Semaphore<F>) => Kind<F, void> = sem =>
  sem.acquire();

export const release: <F>(sem: Semaphore<F>) => Kind<F, void> = sem =>
  sem.release();

export const withPermit: <F>(
  sem: Semaphore<F>,
) => <A>(fa: Kind<F, A>) => Kind<F, A> = sem => fa => withPermit_(sem, fa);

export const withPermit_: <F, A>(
  sem: Semaphore<F>,
  fa: Kind<F, A>,
) => Kind<F, A> = (sem, fa) => sem.withPermit(fa);