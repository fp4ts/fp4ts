// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Either, Left, Right } from '@fp4ts/cats';
import {
  Attempt,
  Continuation,
  Fail,
  FlatMap,
  HandleErrorWith,
  Map,
  SyncIO,
  view,
} from './algebra';
import { pure } from './constructors';

export const attempt: <A>(ioa: SyncIO<A>) => SyncIO<Either<Error, A>> = ioa =>
  new Attempt(ioa);

export const redeemWith: <A, B>(
  h: (e: Error) => SyncIO<B>,
  f: (a: A) => SyncIO<B>,
) => (ioa: SyncIO<A>) => SyncIO<B> = (h, f) => ioa => redeemWith_(ioa, h, f);

export const handleError: <B>(
  h: (e: Error) => B,
) => <A extends B>(ioa: SyncIO<A>) => SyncIO<B> = h => ioa =>
  handleError_(ioa, h);

export const handleErrorWith: <B>(
  h: (e: Error) => SyncIO<B>,
) => <A extends B>(ioa: SyncIO<A>) => SyncIO<B> = h => ioa =>
  handleErrorWith_(ioa, h);

export const map: <A, B>(f: (a: A) => B) => (ioa: SyncIO<A>) => SyncIO<B> =
  f => ioa =>
    map_(ioa, f);

export const flatMap: <A, B>(
  f: (a: A) => SyncIO<B>,
) => (ioa: SyncIO<A>) => SyncIO<B> = f => ioa => flatMap_(ioa, f);

export const tailRecM: <S>(
  s: S,
) => <A>(f: (s: S) => SyncIO<Either<S, A>>) => SyncIO<A> = s => f =>
  tailRecM_(s, f);

export const unsafeRunSync = <A>(ioa: SyncIO<A>): A => {
  let _cur: SyncIO<unknown> = ioa;
  const stack: unknown[] = [];
  const conts: Continuation[] = [];

  runLoop: while (true) {
    let result:
      | { tag: 'success'; value: unknown }
      | { tag: 'failure'; error: Error };

    while (true) {
      const cur = view(_cur);
      switch (cur.tag) {
        case 0: // 'pure'
          result = { tag: 'success', value: cur.value };
          break;

        case 1: // 'fail'
          result = { tag: 'failure', error: cur.error };
          break;

        case 2: // 'delay'
          try {
            result = { tag: 'success', value: cur.thunk() };
          } catch (error) {
            result = { tag: 'failure', error: error as Error };
          }
          break;

        case 3: /* 'defer' */ {
          try {
            _cur = cur.thunk();
          } catch (error) {
            _cur = new Fail(error as Error);
          }
          continue;
        }

        case 4: // 'map'
          stack.push(cur.fun);
          conts.push(Continuation.MapK);
          _cur = cur.self;
          continue;

        case 5: // 'flatMap'
          stack.push(cur.fun);
          conts.push(Continuation.FlatMapK);
          _cur = cur.self;
          continue;

        case 6: // 'handleErrorWith'
          stack.push(cur.fun);
          conts.push(Continuation.HandleErrorWithK);
          _cur = cur.self;
          continue;

        case 7: // 'attempt'
          conts.push(Continuation.AttemptK);
          _cur = cur.self;
          continue;
      }

      resultLoop: while (true) {
        if (result.tag === 'success') {
          let v: unknown = result.value;

          while (true) {
            const c = conts.pop();
            if (c == null) return v as A;
            switch (c) {
              case 0: {
                const f = stack.pop()! as (u: unknown) => unknown;
                try {
                  v = f(v);
                  continue;
                } catch (error) {
                  result = { tag: 'failure', error: error as Error };
                  continue resultLoop;
                }
              }

              case 1: {
                const f = stack.pop()! as (u: unknown) => SyncIO<unknown>;
                try {
                  _cur = f(v);
                  continue runLoop;
                } catch (error) {
                  result = { tag: 'failure', error: error as Error };
                  continue resultLoop;
                }
              }

              case 2:
                stack.pop(); // skip over error handlers
                continue;

              case 3:
                v = Right(v);
                continue;
            }
          }
        } else {
          let e = result.error;

          while (true) {
            const c = conts.pop();
            if (c == null) throw e;
            switch (c) {
              case 0:
              case 1:
                stack.pop(); // skip over success transformations
                continue;

              case 2: {
                const handler = stack.pop()! as (e: Error) => SyncIO<unknown>;
                try {
                  _cur = handler(e);
                  continue runLoop;
                } catch (error) {
                  e = error as Error;
                  continue;
                }
              }

              case 3:
                result = { tag: 'success', value: Left(result.error) };
                continue resultLoop;
            }
          }
        }
      }
    }
  }
};

// -- Point-ful operators

export const redeem_ = <A, B>(
  ioa: SyncIO<A>,
  h: (e: Error) => B,
  f: (a: A) => B,
): SyncIO<B> =>
  pipe(
    ioa,
    attempt,
    map(ea => {
      return ea.fold(h, f);
    }),
  );

export const redeemWith_ = <A, B>(
  ioa: SyncIO<A>,
  h: (e: Error) => SyncIO<B>,
  f: (a: A) => SyncIO<B>,
): SyncIO<B> =>
  pipe(
    ioa,
    attempt,
    flatMap(ea => ea.fold(h, f)),
  );

export const handleError_ = <A>(
  ioa: SyncIO<A>,
  h: (e: Error) => A,
): SyncIO<A> => new HandleErrorWith(ioa, e => pure(h(e)));

export const handleErrorWith_ = <A>(
  ioa: SyncIO<A>,
  h: (e: Error) => SyncIO<A>,
): SyncIO<A> => new HandleErrorWith(ioa, h);

export const map_ = <A, B>(ioa: SyncIO<A>, f: (a: A) => B): SyncIO<B> =>
  new Map(ioa, f);

export const flatMap_ = <A, B>(
  ioa: SyncIO<A>,
  f: (a: A) => SyncIO<B>,
): SyncIO<B> => new FlatMap(ioa, f);

export const tailRecM_ = <S, A>(
  s: S,
  f: (s: S) => SyncIO<Either<S, A>>,
): SyncIO<A> =>
  pipe(
    f(s),
    flatMap(ea => ea.fold(s => tailRecM_(s, f), pure)),
  );
