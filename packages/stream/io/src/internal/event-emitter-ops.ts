import { EventEmitter } from 'stream';
import { Resource, Sync } from '@fp4ts/effect';

export const registerListener0 =
  <F>(F: Sync<F>) =>
  <E extends EventEmitter, V extends string>(
    emitter: E,
    event: V,
    callback: () => void,
  ): Resource<F, void> =>
    Resource.make(F)(
      F.delay(() => {
        emitter.on(event, callback);
      }),
      () => F.delay(() => emitter.removeListener(event, callback)),
    );

export const registerListener =
  <F>(F: Sync<F>) =>
  <E extends EventEmitter, V extends string, A>(
    emitter: E,
    event: V,
    callback: (a: A) => void,
  ): Resource<F, void> =>
    Resource.make(F)(
      F.delay(() => {
        emitter.on(event, callback);
      }),
      () => F.delay(() => emitter.removeListener(event, callback)),
    );
