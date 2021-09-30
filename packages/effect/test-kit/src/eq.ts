import { Eq, Try } from '@cats4ts/cats';
import { SyncIO } from '@cats4ts/effect-core';

export const eqSyncIO = <A>(E: Eq<A>): Eq<SyncIO<A>> =>
  Eq.by(Try.Eq(Eq.Error.strict, E), x => Try(() => x.unsafeRunSync()));
