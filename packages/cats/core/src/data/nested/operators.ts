import { FunctionK } from '../../arrow';
import { Nested } from './algebra';

export const mapK: <F, H, A>(
  nt: FunctionK<F, H>,
) => <G>(fa: Nested<F, G, A>) => Nested<H, G, A> = nt => fa => mapK_(fa, nt);

export const mapK_ = <F, G, H, A>(
  fa: Nested<F, G, A>,
  nt: FunctionK<F, H>,
): Nested<H, G, A> => new Nested(nt(fa.value));
