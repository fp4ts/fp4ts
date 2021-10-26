/* eslint-disable @typescript-eslint/ban-types */
import { Kind } from '@cats4ts/core';
import { Apply } from './apply';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Functor } from './functor';

/**
 * @category Type Class
 */
export interface Monad<F> extends FlatMap<F>, Applicative<F> {
  readonly Do: Kind<F, [{}]>;

  readonly bindTo: <N extends string, S extends {}, B>(
    name: N,
    fb: Kind<F, [B]> | ((s: S) => Kind<F, [B]>),
  ) => (
    fs: Kind<F, [S]>,
  ) => Kind<F, [{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }]>;
  readonly bindTo_: <N extends string, S extends {}, B>(
    fs: Kind<F, [S]>,
    name: N,
    fb: Kind<F, [B]> | ((s: S) => Kind<F, [B]>),
  ) => Kind<F, [{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }]>;

  readonly bind: <S extends {}, B>(
    fb: Kind<F, [B]> | ((s: S) => Kind<F, [B]>),
  ) => (fs: Kind<F, [S]>) => Kind<F, [S]>;
  readonly bind_: <S extends {}, B>(
    fs: Kind<F, [S]>,
    fb: Kind<F, [B]> | ((s: S) => Kind<F, [B]>),
  ) => Kind<F, [S]>;
}

export type MonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure' | 'tailRecM_'
> &
  Partial<Monad<F>>;
export const Monad = Object.freeze({
  of: <M>(M: MonadRequirements<M>): Monad<M> => {
    const F = Monad.deriveFlatMap(M);
    const A = Monad.deriveApplicative(M);

    const self: Monad<M> = {
      Do: A.pure({}),

      bindTo: (name, fb) => fs => self.bindTo_(fs, name, fb),
      bindTo_: (fs, name, fb) =>
        self.flatMap_(fs, s =>
          self.map_(
            typeof fb === 'function' ? (fb as any)(s) : fb,
            b => ({ ...s, [name]: b } as any),
          ),
        ),

      bind: fb => fs => self.bind_(fs, fb),
      bind_: (fs, fb) =>
        self.flatMap_(fs, s =>
          self.map_(typeof fb === 'function' ? (fb as any)(s) : fb, () => s),
        ),

      ...F,
      ...A,
      ...M,
    };
    return self;
  },

  deriveFunctor: <F>(F: MonadRequirements<F>): Functor<F> =>
    Functor.of({ map_: (fa, f) => F.flatMap_(fa, x => F.pure(f(x))), ...F }),

  deriveApply: <F>(F: MonadRequirements<F>): Apply<F> =>
    Apply.of({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.flatMap_(fa, a => F.pure(f(a)))),
      ...Monad.deriveFunctor(F),
      ...F,
    }),

  deriveApplicative: <F>(F: MonadRequirements<F>): Applicative<F> =>
    Applicative.of({
      ...Monad.deriveApply(F),
      ...F,
    }),

  deriveFlatMap: <F>(F: MonadRequirements<F>): FlatMap<F> =>
    FlatMap.of({
      ...Monad.deriveApply(F),
      ...F,
    }),
});
