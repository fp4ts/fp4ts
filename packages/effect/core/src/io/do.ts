/* eslint-disable @typescript-eslint/ban-types */
import { IO } from './algebra';
import { pure } from './constructors';
import { flatMap_, map_ } from './operators';

export const Do: IO<{}> = pure({});

export const bindTo: <N extends string, S extends {}, B>(
  name: N,
  iob: IO<B> | ((s: S) => IO<B>),
) => (
  ios: IO<S>,
) => IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }> =
  (name, iob) => ios =>
    bindTo_(ios, name, iob);

export const bind: <S extends {}, B>(
  iob: IO<B> | ((s: S) => IO<B>),
) => (ios: IO<S>) => IO<S> = iob => ios => bind_(ios, iob);

export const bindTo_ = <N extends string, S extends {}, B>(
  ios: IO<S>,
  name: N,
  iob: IO<B> | ((s: S) => IO<B>),
): IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }> =>
  flatMap_(ios, s =>
    map_(
      typeof iob === 'function' ? iob(s) : iob,
      b => ({ ...s, [name as N]: b } as any),
    ),
  );

export const bind_ = <S extends {}, B>(
  ios: IO<S>,
  iob: IO<B> | ((s: S) => IO<B>),
): IO<S> =>
  flatMap_(ios, s => map_(typeof iob === 'function' ? iob(s) : iob, () => s));
