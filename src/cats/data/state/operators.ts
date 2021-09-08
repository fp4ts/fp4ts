import { id } from '../../../fp/core';
import { FlatMap, Pure, State, view } from './algebra';
import { get, pure, set } from './constructors';

export const mapState: <S, A, B>(
  f: (s: S, a: A) => [S, B],
) => (fa: State<S, A>) => State<S, B> = f => fa => mapState_(fa, f);

export const map: <A, B>(
  f: (a: A) => B,
) => <S>(fa: State<S, A>) => State<S, B> = f => fa => map_(fa, f);

export const tap: <A>(
  f: (a: A) => unknown,
) => <S>(fa: State<S, A>) => State<S, A> = f => fa => tap_(fa, f);

export const map2: <S, A, B>(
  fa: State<S, A>,
  fb: State<S, B>,
) => <C>(f: (a: A, b: B) => C) => State<S, C> = (fa, fb) => f =>
  map2_(fa, fb, f);

export const product: <S, B>(
  fb: State<S, B>,
) => <A>(fa: State<S, A>) => State<S, [A, B]> = fb => fa => product_(fa, fb);

export const productL: <S, B>(
  fb: State<S, B>,
) => <A>(fa: State<S, A>) => State<S, A> = fb => fa => productL_(fa, fb);

export const productR: <S, B>(
  fb: State<S, B>,
) => <A>(fa: State<S, A>) => State<S, B> = fb => fa => productR_(fa, fb);

export const flatMap: <S, A, B>(
  f: (a: A) => State<S, B>,
) => (fa: State<S, A>) => State<S, B> = f => fa => flatMap_(fa, f);

export const flatTap: <S, A>(
  f: (a: A) => State<S, unknown>,
) => (fa: State<S, A>) => State<S, A> = f => fa => flatTap_(fa, f);

export const runState: <S>(s: S) => <A>(fa: State<S, A>) => [S, A] = s => fa =>
  runState_(fa, s);

// -- Point-ful operators

export const mapState_ = <S, A, B>(
  fa: State<S, A>,
  f: (s: S, a: A) => [S, B],
): State<S, B> =>
  flatMap_(fa, a =>
    flatMap_(get(), s => {
      const [s2, b] = f(s, a);
      return map_(set(s2), () => b);
    }),
  );

export const map_ = <S, A, B>(fa: State<S, A>, f: (a: A) => B): State<S, B> =>
  flatMap_(fa, x => pure(f(x)));

export const map2_ = <S, A, B, C>(
  fa: State<S, A>,
  fb: State<S, B>,
  f: (a: A, b: B) => C,
): State<S, C> => flatMap_(fa, a => map_(fb, b => f(a, b)));

export const product_ = <S, A, B>(
  fa: State<S, A>,
  fb: State<S, B>,
): State<S, [A, B]> => flatMap_(fa, a => map_(fb, b => [a, b]));

export const productL_ = <S, A, B>(
  fa: State<S, A>,
  fb: State<S, B>,
): State<S, A> => flatMap_(fa, a => map_(fb, () => a));

export const productR_ = <S, A, B>(
  fa: State<S, A>,
  fb: State<S, B>,
): State<S, B> => flatMap_(fa, () => map_(fb, b => b));

export const tap_ = <S, A>(
  fa: State<S, A>,
  f: (a: A) => unknown,
): State<S, A> =>
  map_(fa, x => {
    f(x);
    return x;
  });

export const flatMap_ = <S, A, B>(
  fa: State<S, A>,
  f: (a: A) => State<S, B>,
): State<S, B> => new FlatMap(fa, f);

export const flatTap_ = <S, A>(
  fa: State<S, A>,
  f: (a: A) => State<S, unknown>,
): State<S, A> => flatMap_(fa, x => map_(f(x), () => x));

export const flatten = <S, A>(ffa: State<S, State<S, A>>): State<S, A> =>
  flatMap_(ffa, id);

export const runState_ = <S, A>(fa: State<S, A>, s: S): [S, A] => {
  type Frame = (a: unknown) => State<unknown, unknown>;
  let _cur: State<unknown, unknown> = fa;
  let state: unknown = s;
  const stack: Frame[] = [];

  while (true) {
    const cur = view(_cur);

    switch (cur.tag) {
      case 'pure': {
        const next = stack.pop();
        if (!next) return [state, cur.value] as [S, A];
        _cur = next(cur.value);
        continue;
      }

      case 'flatMap':
        stack.push(cur.f);
        _cur = cur.self;
        continue;

      case 'getState':
        _cur = new Pure(state);
        continue;

      case 'setState':
        state = cur.state;
        _cur = new Pure(undefined);
        continue;
    }
  }
};
