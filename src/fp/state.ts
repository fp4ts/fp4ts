/* eslint-disable @typescript-eslint/ban-types */

import { flow, pipe } from './core';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class State<S, A> {}

class Pure<A> extends State<unknown, A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}
class FlatMap<S, A, B> extends State<S, B> {
  public readonly tag = 'flatMap';
  public constructor(
    public readonly sa: State<S, A>,
    public readonly f: (a: A) => State<S, B>,
  ) {
    super();
  }
}
class Get<S> extends State<S, S> {
  public readonly tag = 'get';
}
class Set<S> extends State<S, void> {
  public readonly tag = 'set';
  public constructor(public readonly state: S) {
    super();
  }
}

type StateView<S, A> = Pure<A> | FlatMap<S, any, A> | Get<S> | Set<S>;

export const pure: <S, A>(a: A) => State<S, A> = x => new Pure(x);

export const get = <S, A>(): State<S, S> => new Get();
export const set: <S>(s: S) => State<S, void> = s => new Set(s);

export const map: <A, B>(
  f: (a: A) => B,
) => <S>(sa: State<S, A>) => State<S, B> = f => sa => map_(sa, f);

export const flatMap: <S, A, B>(
  f: (a: A) => State<S, B>,
) => (sa: State<S, A>) => State<S, B> = f => sa => flatMap_(sa, f);

export const modify_ = <S, A>(sa: State<S, A>, f: (s1: S) => S): State<S, A> =>
  pipe(
    Do<S>(),
    bindTo('x', () => sa),
    bind(() => flatMap_(get(), flow(f, set))),
    bind(({ x }) => pure(x)),
  );

export const map_ = <S, A, B>(sa: State<S, A>, f: (a: A) => B): State<S, B> =>
  flatMap_(sa, x => pure(f(x)));

export const flatMap_ = <S, A, B>(
  sa: State<S, A>,
  f: (a: A) => State<S, B>,
): State<S, B> => new FlatMap(sa, f);

// -- Do notation

export const Do: <S>() => State<S, {}> = () => pure({});

export const bindTo: <N extends string, S extends {}, B, SS>(
  name: N,
  iob: (s: S) => State<SS, B>,
) => (ios: State<SS, S>) => State<SS, S & { readonly [K in N]: B }> =
  (name, iob) => ios =>
    bindTo_(ios, name, iob);

export const bind: <S extends {}, B, SS>(
  iob: (s: S) => State<SS, B>,
) => (ios: State<SS, S>) => State<SS, S> = iob => ios => bind_(ios, iob);

export const bindTo_ = <N extends string, S extends {}, B, SS>(
  ios: State<SS, S>,
  name: N,
  iob: (s: S) => State<SS, B>,
): State<SS, S & { readonly [K in N]: B }> =>
  flatMap_(ios, s => map_(iob(s), b => ({ ...s, [name as N]: b } as any)));

export const bind_ = <S extends {}, B, SS>(
  ios: State<SS, S>,
  iob: (s: S) => State<SS, B>,
): State<SS, S> => flatMap_(ios, s => map_(iob(s), () => s));

// Execution

const view = <S, A>(sa: State<S, A>): StateView<S, A> => sa as any;

export function runState_<S, A>(sa: State<S, A>, s: S): [A, S] {
  let _cur: State<S, unknown> = sa;
  let state: S = s;
  const flatMaps: ((x: unknown) => State<S, unknown>)[] = [];

  while (true) {
    const cur = view(_cur);
    switch (cur.tag) {
      case 'pure': {
        const next = flatMaps.pop();
        if (!next) return [cur.value as A, state];
        _cur = next(cur.value);
        continue;
      }

      case 'get':
        _cur = pure(state);
        continue;

      case 'set':
        state = cur.state;
        _cur = pure(undefined);
        continue;

      case 'flatMap':
        flatMaps.push(cur.f);
        _cur = cur.sa;
        continue;
    }
  }
}
