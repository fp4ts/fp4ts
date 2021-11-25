import { Readable, Writable } from 'stream';
import { Byte, fst, Kind, pipe, snd, tupled } from '@fp4ts/core';
import { Option, Some, None, Either } from '@fp4ts/cats';
import { Async, Resource, SyncIO, Dispatcher } from '@fp4ts/effect';
import { Stream, Channel, Chunk, Pull, Pipe } from '@fp4ts/stream-core';

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
      RF.bindTo(
        'channel',
        Resource.evalF(Channel.synchronous<F, Option<void>>(F)),
      ),
      RF.bindTo('error', Resource.evalF(F.deferred<Error>())),

      RF.bindTo('resourceReadable', ({ dispatcher, channel, error }) =>
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
              dispatcher.unsafeRunAndForget(channel.send(Some(undefined))),
            ),
          ),
          RS.bind(({ readable }) =>
            registerListener0(S)(readable, 'end', () =>
              dispatcher.unsafeRunAndForget(channel.send(None)),
            ),
          ),
          RS.bind(({ readable }) =>
            registerListener0(S)(readable, 'close', () =>
              dispatcher.unsafeRunAndForget(channel.send(None)),
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
      RF.map(({ readable, channel, error }) => {
        const stream = channel.stream
          .unNoneTerminate()
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
