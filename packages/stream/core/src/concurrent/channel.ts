// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { id, Kind, pipe } from '@fp4ts/core';
import {
  Either,
  Left,
  Option,
  None,
  Vector,
  Some,
} from '@fp4ts/cats-core/lib/data';
import { Concurrent, Deferred, Poll } from '@fp4ts/effect-kernel';
import { Chunk } from '../chunk';
import { Pipe } from '../pipe';
import { Pull } from '../pull';
import { Stream } from '../stream';

const ChannelClosed = Object.freeze({ tag: 'channel_closed' });
type ChannelClosed = typeof ChannelClosed & { __void: never };

export class Channel<F, A> {
  private readonly __void!: void;

  public constructor(
    public readonly sendAll: Pipe<F, A, never>,
    public readonly send: (a: A) => Kind<F, [Either<ChannelClosed, void>]>,
    public readonly stream: Stream<F, A>,
    public readonly close: Kind<F, [Either<ChannelClosed, void>]>,
    public readonly isClosed: Kind<F, [boolean]>,
    public readonly closed: Kind<F, [void]>,
  ) {}

  private static readonly closed = Left(ChannelClosed);

  public static readonly unbounded = <F, A>(
    F: Concurrent<F, Error>,
  ): Kind<F, [Channel<F, A>]> => this.bounded(F)(Infinity);

  public static readonly synchronous = <F, A>(
    F: Concurrent<F, Error>,
  ): Kind<F, [Channel<F, A>]> => this.bounded(F)(0);

  public static readonly bounded =
    <F>(F: Concurrent<F, Error>) =>
    <A>(capacity: number): Kind<F, [Channel<F, A>]> => {
      assert(capacity >= 0, 'Channel capacity must be >= 0');
      const initial = new State<F, A>(
        Vector.empty,
        0,
        None,
        Vector.empty,
        false,
      );

      return F.map2_(
        F.ref(initial),
        F.deferred<void>(),
      )((state, closedGate) => {
        const sendAll: Pipe<F, A, never> = ins =>
          ins['+++'](Stream.execF(F.void(close)))
            .evalMap(send)
            .takeWhile(ea => ea.isRight).drain;

        const send = (a: A) =>
          F.flatMap_(F.deferred<void>(), producer =>
            F.flatten(
              F.uncancelable(poll =>
                state.modify(s => {
                  if (s.closed) return [s, F.pure(Channel.closed)];
                  return s.size < capacity
                    ? [
                        s.copy({
                          values: s.values['::+'](a),
                          size: s.size + 1,
                          waiting: None,
                        }),
                        notifyStream(s.waiting),
                      ]
                    : [
                        s.copy({
                          waiting: None,
                          producers: s.producers['::+']([a, producer]),
                        }),
                        F.productL_(
                          notifyStream(s.waiting),
                          waitOnBound(producer, poll),
                        ),
                      ];
                }),
              ),
            ),
          );

        const close = F.uncancelable(() =>
          F.flatten(
            state.modify(s =>
              s.closed
                ? [s, F.pure(Channel.closed)]
                : [
                    s.copy({ closed: true, waiting: None }),
                    F.productL_(notifyStream(s.waiting), signalClosure),
                  ],
            ),
          ),
        );

        const isClosed = F.map_(closedGate.tryGet(), o => o.nonEmpty);
        const closed = closedGate.get();

        const consumeLoop: Pull<F, A, void> = pipe(
          F.deferred<void>(),
          F.flatMap(waiting =>
            state.modify(s => {
              if (s.values.nonEmpty || s.producers.nonEmpty) {
                let unblock = F.unit;
                let allValues = s.values;

                s.producers.forEach(([value, producer]) => {
                  unblock = F.productR_(unblock, producer.complete(undefined));
                  allValues = allValues['::+'](value);
                });

                const toEmit = Chunk.fromVector(allValues);

                return [
                  s.copy({
                    values: Vector(),
                    size: 0,
                    waiting: None,
                    producers: Vector(),
                  }),
                  F.map_(unblock, () =>
                    Pull.output<F, A>(toEmit)['>>>'](() => consumeLoop),
                  ),
                ];
              } else {
                return [
                  s.copy({ waiting: Some(waiting) }),
                  F.pure(
                    s.closed
                      ? Pull.done()
                      : Pull.evalF(waiting.get())['>>>'](() => consumeLoop),
                  ),
                ];
              }
            }),
          ),
          F.flatten,
          Pull.evalF,
          x => x.flatMap(id),
        );

        const stream = consumeLoop.stream();

        const notifyStream = (waitForChanges: Option<Deferred<F, void>>) =>
          waitForChanges.fold(
            () => F.pure(Either.rightUnit),
            changes =>
              F.map_(changes.complete(undefined), () => Either.rightUnit),
          );

        const waitOnBound = (producer: Deferred<F, void>, poll: Poll<F>) =>
          F.onCancel_(
            poll(producer.get()),
            state.update(s =>
              s.copy({
                producers: s.producers.filter(([, x]) => x !== producer),
              }),
            ),
          );

        const signalClosure = closedGate.complete(undefined);

        return new Channel(sendAll, send, stream, close, isClosed, closed);
      });
    };
}

type StateProps<F, A> = {
  readonly values: Vector<A>;
  readonly size: number;
  readonly waiting: Option<Deferred<F, void>>;
  readonly producers: Vector<[A, Deferred<F, void>]>;
  readonly closed: boolean;
};
class State<F, A> {
  public constructor(
    public readonly values: Vector<A>,
    public readonly size: number,
    public readonly waiting: Option<Deferred<F, void>>,
    public readonly producers: Vector<[A, Deferred<F, void>]>,
    public readonly closed: boolean,
  ) {}

  public readonly copy = ({
    values = this.values,
    size = this.size,
    waiting = this.waiting,
    producers = this.producers,
    closed = this.closed,
  }: Partial<StateProps<F, A>>): State<F, A> =>
    new State(values, size, waiting, producers, closed);
}
