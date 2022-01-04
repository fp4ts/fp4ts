import { Byte } from '@fp4ts/core';
import { PureK, Stream } from '@fp4ts/stream';

export type EntityBody<F> = Stream<F, Byte>;
export const EntityBody = Object.freeze({
  empty: <F = PureK>(): Stream<F, Byte> => Stream.empty(),
});
