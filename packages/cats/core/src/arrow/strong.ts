import { Kind } from '@fp4ts/core';
import { Profunctor, ProfunctorRequirements } from './profunctor';

/**
 * @category Type Class
 */
export interface Strong<F> extends Profunctor<F> {
  readonly first: <A, B, C>(fab: Kind<F, [A, B]>) => Kind<F, [[A, C], [B, C]]>;
  readonly second: <A, B, C>(fab: Kind<F, [A, B]>) => Kind<F, [[C, A], [C, B]]>;
}

export type StrongRequirements<F> = Pick<Strong<F>, 'first' | 'second'> &
  ProfunctorRequirements<F> &
  Partial<Strong<F>>;
export const Strong = Object.freeze({
  of: <F>(F: StrongRequirements<F>): Strong<F> => ({
    ...Profunctor.of(F),
    ...F,
  }),
});
