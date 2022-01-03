// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Duplex, Readable, Writable } from 'stream';
import { Byte, fst, Kind, pipe, snd, tupled } from '@fp4ts/core';
import { Option, Some, None, Either, Show } from '@fp4ts/cats';
import { Async, Resource, SyncIO, Dispatcher, Queue } from '@fp4ts/effect';
import { Stream, Chunk, Pull, Pipe, text } from '@fp4ts/stream-core';

import { registerListener, registerListener0 } from './internal';

type ReadableOps = {
  destroyIfNotEnded: boolean;
  destroyIfCanceled: boolean;
};

export const readReadable =
  <F>(F: Async<F>) =>
  (
    readable: Kind<F, [Readable]>,
    options?: Partial<ReadableOps>,
  ): Stream<F, Byte> =>
    Stream.evalF(readable)
      .flatMap(r =>
        Stream.resource(F)(suspendReadableAndRead(F)(options)(() => r)),
      )
      .flatMap(snd);

export const suspendReadableAndRead =
  <F>(F: Async<F>) =>
  ({
    destroyIfNotEnded = true,
    destroyIfCanceled = true,
  }: Partial<ReadableOps> = {}) =>
  <R extends Readable>(thunk: () => R): Resource<F, [R, Stream<F, Byte>]> => {
    const S = SyncIO.Sync;
    const RF = Resource.Monad<F>();
    const RS = Resource.Sync(SyncIO.Sync);

    return pipe(
      RF.Do,
      RF.bindTo('dispatcher', Dispatcher(F)),
      RF.bindTo('queue', Resource.evalF(Queue.synchronous<F, Option<void>>(F))),
      RF.bindTo('error', Resource.evalF(F.deferred<Error>())),

      RF.bindTo('resourceReadable', ({ dispatcher, queue, error }) =>
        pipe(
          RS.Do,
          RS.bindTo(
            'readable',
            Resource.make(S)(SyncIO(thunk), (readable, ec) =>
              ec.fold(
                () =>
                  destroyIfCanceled
                    ? SyncIO(() => readable.destroy())
                    : SyncIO.unit,
                e => SyncIO(() => readable.destroy(e)),
                () =>
                  !readable.readableEnded && destroyIfNotEnded
                    ? SyncIO(() => readable.destroy())
                    : SyncIO.unit,
              ),
            ),
          ),

          RS.bind(({ readable }) =>
            registerListener0(S)(readable, 'readable', () =>
              dispatcher.unsafeRunAndForget(queue.offer(Some(undefined))),
            ),
          ),
          RS.bind(({ readable }) =>
            registerListener0(S)(readable, 'end', () =>
              dispatcher.unsafeRunAndForget(queue.offer(None)),
            ),
          ),
          RS.bind(({ readable }) =>
            registerListener0(S)(readable, 'close', () =>
              dispatcher.unsafeRunAndForget(queue.offer(None)),
            ),
          ),
          RS.bind(({ readable }) =>
            registerListener(S)(readable, 'error', (e: Error) =>
              dispatcher.unsafeRunAndForget(error.complete(e)),
            ),
          ),

          RS.map(({ readable }) => readable),
          RF.pure,
        ),
      ),
      RF.bindTo('readable', ({ resourceReadable }) =>
        Resource.make(F)(
          F.delay(() =>
            resourceReadable.allocated(SyncIO.Sync).unsafeRunSync(),
          ),
          (_, close) =>
            close.fold(
              () => F.canceled,
              e => F.throwError(e),
              () => F.unit,
            ),
        ).map(fst),
      ),
      RF.map(({ readable, queue, error }) => {
        const stream = Stream.fromQueueNoneTerminated(queue)
          .concurrently(F)(Stream.evalF(F.flatMap_(error.get(), F.throwError)))
          .flatMap(() =>
            Stream.evalUnChunk(
              F.delay(() =>
                Option(readable.read() as Buffer).fold(
                  () => Chunk.empty,
                  Chunk.fromBuffer,
                ),
              ),
            ),
          );

        return tupled(readable, stream);
      }),
    );
  };

export const toReadable =
  <F>(F: Async<F>): Pipe<F, Byte, Readable> =>
  (is: Stream<F, Byte>): Stream<F, Readable> =>
    Stream.resource(F)(mkDuplex(F)(is)).flatMap(([duplex, out]) =>
      Stream.pure<F, Duplex>(duplex).merge(F)(out.drain).concurrently(F)(
        Stream.evalF(
          F.async_<void>(cb => duplex.end(() => cb(Either.rightUnit))),
        ),
      ),
    );

export const writeWritable =
  <F>(F: Async<F>) =>
  (
    writable: Kind<F, [Writable]>,
    endAfterUse: boolean = true,
  ): Pipe<F, Byte, never> =>
  (is: Stream<F, Byte>) =>
    Stream.evalF(writable).flatMap(writable => {
      const go = (pull: Pull<F, Byte, void>): Pull<F, never, void> =>
        pull.uncons.flatMap(opt =>
          opt.fold(
            () =>
              endAfterUse
                ? Pull.evalF(
                    F.async_<void>(cb =>
                      writable.end(() => cb(Either.rightUnit)),
                    ),
                  )
                : Pull.done(),
            ([hd, tl]) =>
              Pull.evalF(
                F.async_<void>(cb =>
                  writable.write(hd.toUint8Array(), e =>
                    cb(Option(e).toLeft(() => {})),
                  ),
                ),
              )['>>>'](() => go(tl)),
          ),
        );

      return go(is.pull)
        .stream()
        .handleErrorWith(e => Stream.evalF(F.delay(() => writable.destroy(e))))
        .drain;
    });

export const readWritable =
  <F>(F: Async<F>) =>
  (f: (w: Writable) => Kind<F, [void]>): Stream<F, Byte> =>
    Stream.empty<F>().through(toDuplexAndRead(F)(f));

export const toDuplexAndRead =
  <F>(F: Async<F>) =>
  (f: (d: Duplex) => Kind<F, [void]>): Pipe<F, Byte, Byte> =>
  (is: Stream<F, Byte>): Stream<F, Byte> =>
    Stream.resource(F)(mkDuplex(F)(is)).flatMap(([duplex, out]) =>
      Stream.evalF(f(duplex)).drain.merge<F, Byte>(F)(out),
    );

export const stdin = <F>(F: Async<F>): Stream<F, Byte> =>
  readReadable(F)(
    F.delay(() => process.stdin),
    {
      destroyIfNotEnded: false,
      destroyIfCanceled: false,
    },
  );

export const stdinUtf8 = <F>(F: Async<F>): Stream<F, string> =>
  stdin(F).through(text.utf8.decode());

export const stdinLines = <F>(F: Async<F>): Stream<F, string> =>
  stdinUtf8(F).through(text.lines());

export const stdout = <F>(F: Async<F>): Pipe<F, Byte, never> =>
  writeWritable(F)(
    F.delay(() => process.stdout),
    false,
  );

export const stdoutLines =
  <F, A>(F: Async<F>, S: Show<A> = Show.fromToString()): Pipe<F, A, never> =>
  (is: Stream<F, A>): Stream<F, never> =>
    is
      .map(x => `${S.show(x)}\n`)
      .through(text.utf8.encode())
      .through(stdout(F));

// -- Private implementation

const mkDuplex =
  <F>(F: Async<F>) =>
  (is: Stream<F, Byte>): Resource<F, [Duplex, Stream<F, Byte>]> => {
    const RF = Resource.Monad<F>();

    return pipe(
      RF.Do,
      RF.bindTo('dispatcher', Dispatcher(F)),
      RF.bindTo(
        'readQueue',
        Resource.evalF(Queue.bounded(F)<Option<Chunk<Byte>>>(1)),
      ),
      RF.bindTo(
        'writeQueue',
        Resource.evalF(Queue.synchronous<F, Option<Chunk<Byte>>>(F)),
      ),
      RF.bindTo('error', Resource.evalF(F.deferred<Error>())),
      RF.bindTo('duplex', ({ dispatcher, readQueue, writeQueue, error }) =>
        Resource.make(F)(
          F.delay(
            () =>
              new Duplex({
                read() {
                  dispatcher.unsafeRunAndForget(
                    pipe(
                      readQueue.take(),
                      F.attempt,
                      F.flatMap(ea =>
                        ea.fold(
                          e => F.delay(() => this.destroy(e)),
                          oChunk =>
                            F.delay(() =>
                              this.push(
                                oChunk
                                  .map(c => c.toUint8Array())
                                  .getOrElse(() => null),
                              ),
                            ),
                        ),
                      ),
                      F.void,
                    ),
                  );
                },
                write: (c, _, cb) => {
                  dispatcher.unsafeRunAndForget(
                    pipe(
                      writeQueue.offer(Some(Chunk.fromBuffer(c))),
                      F.attempt,
                      F.flatMap(ea =>
                        F.delay(() => cb(ea.swapped.getOrElse(() => null))),
                      ),
                    ),
                  );
                },
                final: cb => {
                  dispatcher.unsafeRunAndForget(
                    pipe(
                      writeQueue.offer(None),
                      F.attempt,
                      F.flatMap(ea =>
                        F.delay(() => cb(ea.swapped.getOrElse(() => null))),
                      ),
                    ),
                  );
                },
                destroy: (err, cb) => {
                  dispatcher.unsafeRunAndForget(
                    pipe(
                      error.complete(
                        Option(err).getOrElse(
                          () => new Error('StreamDestroyed'),
                        ),
                      ),
                      F.attempt,
                      F.flatMap(ea =>
                        F.delay(() => cb(ea.swapped.getOrElse(() => null))),
                      ),
                    ),
                  );
                },
              }),
          ),
          duplex =>
            duplex.readableEnded || duplex.writableEnded
              ? F.delay(() => duplex.destroy())
              : F.unit,
        ),
      ),
      RF.bindTo('drainIn', ({ readQueue }) =>
        RF.pure(is.enqueueNoneTerminatedChunks(readQueue).drain),
      ),
      RF.bindTo('out', ({ writeQueue, error }) =>
        RF.pure(
          Stream.fromQueueNoneTerminatedChunk(writeQueue).concurrently(F)(
            Stream.evalF(F.flatMap_(error.get(), F.throwError)),
          ),
        ),
      ),
      RF.map(({ duplex, drainIn, out }) =>
        tupled(duplex, drainIn.merge<F, Byte>(F)(out)),
      ),
    );
  };
