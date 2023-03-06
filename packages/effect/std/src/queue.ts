// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Kind, tupled } from '@fp4ts/core';
import { Option, Some, None, FunctionK } from '@fp4ts/cats';
import { Seq } from '@fp4ts/collections';
import { Concurrent, Deferred, Poll, Ref } from '@fp4ts/effect-kernel';

export abstract class Queue<F, A>
  implements QueueSource<F, A>, QueueSink<F, A>
{
  public static readonly bounded =
    <F>(F: Concurrent<F, any>) =>
    <A>(capacity: number): Kind<F, [Queue<F, A>]> => {
      assert(capacity >= 0, 'Capacity expected to be >=0');
      return F.map_(
        F.ref<State<F, A>>(State.empty()),
        s => new BoundedQueue(F, capacity, s),
      );
    };

  public static readonly synchronous = <F, A>(
    F: Concurrent<F, any>,
  ): Kind<F, [Queue<F, A>]> => Queue.bounded(F)(0);

  public static readonly unbounded = <F, A>(
    F: Concurrent<F, any>,
  ): Kind<F, [Queue<F, A>]> => Queue.bounded(F)(Infinity);

  public static readonly dropping =
    <F>(F: Concurrent<F, any>) =>
    <A>(capacity: number): Kind<F, [Queue<F, A>]> => {
      assert(capacity > 0, 'Capacity expected to be >0');
      return F.map_(
        F.ref<State<F, A>>(State.empty()),
        s => new DroppingQueue(F, capacity, s),
      );
    };

  public static readonly circularBuffer =
    <F>(F: Concurrent<F, any>) =>
    <A>(capacity: number): Kind<F, [Queue<F, A>]> => {
      assert(capacity > 0, 'Capacity expected to be >0');
      return F.map_(
        F.ref<State<F, A>>(State.empty()),
        s => new CircularBufferQueue(F, capacity, s),
      );
    };

  public abstract readonly size: Kind<F, [number]>;
  public abstract take(): Kind<F, [A]>;
  public abstract tryTake(): Kind<F, [Option<A>]>;
  public abstract offer(a: A): Kind<F, [void]>;
  public abstract tryOffer(a: A): Kind<F, [boolean]>;

  public mapK<G>(nt: FunctionK<F, G>): Queue<G, A> {
    return new TranslateQueue(this, nt);
  }
}

export interface QueueSource<F, A> {
  readonly size: Kind<F, [number]>;
  take(): Kind<F, [A]>;
  tryTake(): Kind<F, [Option<A>]>;
}

export interface QueueSink<F, A> {
  offer(a: A): Kind<F, [void]>;
  tryOffer(a: A): Kind<F, [boolean]>;
}

abstract class AbstractQueue<F, A> extends Queue<F, A> {
  public constructor(
    protected readonly F: Concurrent<F, any>,
    protected readonly capacity: number,
    protected readonly state: Ref<F, State<F, A>>,
  ) {
    super();
  }

  protected abstract onOfferNoCapacity(
    s: State<F, A>,
    a: A,
    offerer: Deferred<F, void>,
    poll: Poll<F>,
  ): [State<F, A>, Kind<F, [void]>];
  protected abstract onTryOfferNoCapacity(
    s: State<F, A>,
    a: A,
  ): [State<F, A>, Kind<F, [boolean]>];

  public get size(): Kind<F, [number]> {
    return this.F.map_(this.state.get(), ({ size }) => size);
  }

  public offer(a: A): Kind<F, [void]> {
    const { F } = this;
    return F.flatMap_(F.deferred<void>(), offerer =>
      F.uncancelable(poll =>
        F.flatten(
          this.state.modify(s => {
            if (s.takers.nonEmpty) {
              const [taker, rest] = s.takers.uncons.get;
              return tupled(
                s.copy({ takers: rest }),
                F.void(taker.complete(a)),
              );
            } else if (s.size < this.capacity) {
              return tupled(
                s.copy({ queue: s.queue.append(a), size: s.size + 1 }),
                F.unit,
              );
            } else {
              return this.onOfferNoCapacity(s, a, offerer, poll);
            }
          }),
        ),
      ),
    );
  }

  public tryOffer(a: A): Kind<F, [boolean]> {
    const { F } = this;
    return F.uncancelable(() =>
      F.flatten(
        this.state.modify(s => {
          if (s.takers.nonEmpty) {
            const [taker, rest] = s.takers.uncons.get;
            return tupled(
              s.copy({ takers: rest }),
              F.map_(taker.complete(a), () => true),
            );
          } else if (s.size < this.capacity) {
            return tupled(
              s.copy({ queue: s.queue.append(a), size: s.size + 1 }),
              F.pure(true),
            );
          } else {
            return this.onTryOfferNoCapacity(s, a);
          }
        }),
      ),
    );
  }

  public take(): Kind<F, [A]> {
    const { F } = this;
    return F.flatMap_(F.deferred<A>(), taker =>
      F.uncancelable(poll =>
        F.flatten(
          this.state.modify(s => {
            if (s.queue.nonEmpty && s.offerers.isEmpty) {
              const [a, rest] = s.queue.uncons.get;
              return tupled(
                s.copy({ queue: rest, size: s.size - 1 }),
                F.pure(a),
              );
            } else if (s.queue.nonEmpty) {
              const [a, rest] = s.queue.uncons.get;
              const [[move, release], tail] = s.offerers.uncons.get;
              return tupled(
                s.copy({ queue: rest.append(move), offerers: tail }),
                F.map_(release.complete(), () => a),
              );
            } else if (s.offerers.nonEmpty) {
              const [[a, release], tail] = s.offerers.uncons.get;
              return tupled(
                s.copy({ offerers: tail }),
                F.map_(release.complete(), () => a),
              );
            } else {
              const cleanup = this.state.update(s =>
                s.copy({ takers: s.takers.filter(t => t !== taker) }),
              );

              return tupled(
                s.copy({ takers: s.takers.append(taker) }),
                F.onCancel_(poll(taker.get()), cleanup),
              );
            }
          }),
        ),
      ),
    );
  }

  public tryTake(): Kind<F, [Option<A>]> {
    const { F } = this;
    return F.uncancelable(() =>
      F.flatten(
        this.state.modify(s => {
          if (s.queue.nonEmpty && s.offerers.isEmpty) {
            const [a, rest] = s.queue.uncons.get;
            return tupled(
              s.copy({ queue: rest, size: s.size - 1 }),
              F.pure(Some(a)),
            );
          } else if (s.queue.nonEmpty) {
            const [a, rest] = s.queue.uncons.get;
            const [[move, release], tail] = s.offerers.uncons.get;
            return tupled(
              s.copy({ queue: rest.append(move), offerers: tail }),
              F.map_(release.complete(), () => Some(a)),
            );
          } else if (s.offerers.nonEmpty) {
            const [[a, release], tail] = s.offerers.uncons.get;
            return tupled(
              s.copy({ offerers: tail }),
              F.map_(release.complete(), () => Some(a)),
            );
          } else {
            return tupled(s, F.pure(None));
          }
        }),
      ),
    );
  }
}

class BoundedQueue<F, A> extends AbstractQueue<F, A> {
  protected onOfferNoCapacity(
    s: State<F, A>,
    a: A,
    offerer: Deferred<F, void>,
    poll: Poll<F>,
  ): [State<F, A>, Kind<F, [void]>] {
    const cleanup = this.state.update(s =>
      s.copy({ offerers: s.offerers.filter(o => o[1] !== offerer) }),
    );
    return tupled(
      s.copy({ offerers: s.offerers.append([a, offerer]) }),
      this.F.onCancel_(poll(offerer.get()), cleanup),
    );
  }

  protected onTryOfferNoCapacity(
    s: State<F, A>,
    a: A,
  ): [State<F, A>, Kind<F, [boolean]>] {
    return tupled(s, this.F.pure(false));
  }
}

class DroppingQueue<F, A> extends AbstractQueue<F, A> {
  protected onOfferNoCapacity(
    s: State<F, A>,
    a: A,
    offerer: Deferred<F, void>,
    poll: Poll<F>,
  ): [State<F, A>, Kind<F, [void]>] {
    return tupled(s, this.F.unit);
  }

  protected onTryOfferNoCapacity(
    s: State<F, A>,
    a: A,
  ): [State<F, A>, Kind<F, [boolean]>] {
    return tupled(s, this.F.pure(false));
  }
}

class CircularBufferQueue<F, A> extends AbstractQueue<F, A> {
  protected onOfferNoCapacity(
    s: State<F, A>,
    a: A,
    offerer: Deferred<F, void>,
    poll: Poll<F>,
  ): [State<F, A>, Kind<F, [void]>] {
    const [ss, fb] = this.onTryOfferNoCapacity(s, a);
    return [ss, this.F.void(fb)];
  }

  protected onTryOfferNoCapacity(
    s: State<F, A>,
    a: A,
  ): [State<F, A>, Kind<F, [boolean]>] {
    const [, rest] = s.queue.uncons.get;
    return tupled(s.copy({ queue: rest.append(a) }), this.F.pure(true));
  }
}

class TranslateQueue<G, F, A> extends Queue<G, A> {
  public constructor(
    private readonly wrapped: Queue<F, A>,
    private readonly nt: FunctionK<F, G>,
  ) {
    super();
  }

  public get size(): Kind<G, [number]> {
    return this.nt(this.wrapped.size);
  }
  public offer(a: A): Kind<G, [void]> {
    return this.nt(this.wrapped.offer(a));
  }
  public take(): Kind<G, [A]> {
    return this.nt(this.wrapped.take());
  }
  public tryOffer(a: A): Kind<G, [boolean]> {
    return this.nt(this.wrapped.tryOffer(a));
  }
  public tryTake(): Kind<G, [Option<A>]> {
    return this.nt(this.wrapped.tryTake());
  }
}

type Props<F, A> = {
  readonly queue: Seq<A>;
  readonly size: number;
  readonly takers: Seq<Deferred<F, A>>;
  readonly offerers: Seq<[A, Deferred<F, void>]>;
};
class State<F, A> {
  public static readonly empty = <F, A>(): State<F, A> =>
    new State(Seq.empty, 0, Seq.empty, Seq.empty);

  public constructor(
    public readonly queue: Seq<A>,
    public readonly size: number,
    public readonly takers: Seq<Deferred<F, A>>,
    public readonly offerers: Seq<[A, Deferred<F, void>]>,
  ) {}

  public copy({
    queue = this.queue,
    size = this.size,
    takers = this.takers,
    offerers = this.offerers,
  }: Partial<Props<F, A>> = {}): State<F, A> {
    return new State(queue, size, takers, offerers);
  }
}
