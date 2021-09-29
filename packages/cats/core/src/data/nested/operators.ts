import { AnyK } from '@cats4ts/core';
import { FunctionK } from '../../arrow';
import { Nested } from './algebra';

export const mapK: <F extends AnyK, H extends AnyK, A>(
  nt: FunctionK<F, H>,
) => <G extends AnyK>(fa: Nested<F, G, A>) => Nested<H, G, A> = nt => fa =>
  mapK_(fa, nt);

export const mapK_ = <F extends AnyK, G extends AnyK, H extends AnyK, A>(
  fa: Nested<F, G, A>,
  nt: FunctionK<F, H>,
): Nested<H, G, A> => new Nested(nt(fa.value));
