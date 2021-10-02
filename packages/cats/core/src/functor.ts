import { instance, Kind, AnyK } from '@cats4ts/core';
import { Invariant } from './invariant';
import { ComposedFunctor } from './composed';

export interface Functor<F extends AnyK> extends Invariant<F> {
  readonly map: <A, B>(f: (a: A) => B) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly map_: <A, B>(fa: Kind<F, [A]>, f: (a: A) => B) => Kind<F, [B]>;

  readonly tap: <A>(f: (a: A) => unknown) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly tap_: <A>(fa: Kind<F, [A]>, f: (a: A) => unknown) => Kind<F, [A]>;

  readonly void: <A>(fa: Kind<F, [A]>) => Kind<F, [void]>;
}

export type FunctorRequirements<F extends AnyK> = Pick<Functor<F>, 'map_'> &
  Partial<Functor<F>>;
export const Functor = Object.freeze({
  of: <F extends AnyK>(F: FunctorRequirements<F>): Functor<F> =>
    instance<Functor<F>>({
      map: f => fa => F.map_(fa, f),

      imap: f => fa => F.map_(fa, f),
      imap_: (fa, f) => F.map_(fa, f),

      tap: f => fa => F.map_(fa, x => (f(x), x)),
      tap_: (fa, f) => F.map_(fa, x => (f(x), x)),

      void: fa => F.map_(fa, () => undefined),

      ...F,
    }),

  compose: <F extends AnyK, G extends AnyK>(
    F: Functor<F>,
    G: Functor<G>,
  ): ComposedFunctor<F, G> => ComposedFunctor.of(F, G),
});
