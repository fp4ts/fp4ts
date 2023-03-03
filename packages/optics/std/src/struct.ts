// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  IndexPreservingLens,
  IndexPreservingPLens,
  iplens,
} from '@fp4ts/optics-core';

export function prop<S, T, k extends keyof S & keyof T>(
  k: k,
): IndexPreservingPLens<S, T, S[k], T[k]>;
export function prop<S, k extends keyof S>(k: k): IndexPreservingLens<S, S[k]>;
export function prop<S, k extends keyof S>(k: k): IndexPreservingLens<S, S[k]> {
  return iplens(
    s => s[k],
    s => sk => ({ ...s, [k]: sk }),
  );
}
export function pick<
  S,
  T,
  ks extends readonly [keyof S & keyof T, ...(keyof S & keyof T)[]],
>(
  ...ks: ks
): IndexPreservingPLens<S, T, Pick<S, ks[number]>, Pick<T, ks[number]>>;
export function pick<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  ...ks: ks
): IndexPreservingLens<S, Pick<S, ks[number]>>;
export function pick<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  ...ks: ks
): IndexPreservingLens<S, Pick<S, ks[number]>> {
  return iplens(
    s => _pick(s, ks),
    s => sk => ({ ...s, ...sk }),
  );
}

export function omit<
  S,
  T,
  ks extends readonly [keyof S & keyof T, ...(keyof S & keyof T)[]],
>(
  ...ks: ks
): IndexPreservingPLens<S, T, Omit<S, ks[number]>, Omit<T, ks[number]>>;
export function omit<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  ...ks: ks
): IndexPreservingLens<S, Omit<S, ks[number]>>;
export function omit<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  ...ks: ks
): IndexPreservingLens<S, Omit<S, ks[number]>> {
  return iplens(
    s => _omit(s, ks),
    s => sks => ({ ...s, ...sks }),
  );
}

function _pick<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  s: S,
  ks: ks,
): Pick<S, ks[number]> {
  const sks: Partial<Pick<S, ks[number]>> = {};
  for (let i = 0, len = ks.length; i < len; i++) {
    sks[ks[i]] = s[ks[i]];
  }
  return sks as Pick<S, ks[number]>;
}

function _omit<S, ks extends readonly [keyof S, ...(keyof S)[]]>(
  s: S,
  ks: ks,
): Omit<S, ks[number]> {
  const sks: S = { ...s };
  for (let i = 0, len = ks.length; i < len; i++) {
    delete (sks as any)[ks[i] as any];
  }
  return sks as Omit<S, ks[number]>;
}
