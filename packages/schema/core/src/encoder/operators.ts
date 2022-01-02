// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { AndThen } from '@fp4ts/cats';
import { Encoder } from './algebra';

export const nullable = <O, A>(
  fa: Encoder<O, A>,
): Encoder<O | null, A | null> =>
  new Encoder(x => (x === null ? null : fa.encode(x)));

export const map: <O1, O2>(
  f: (o: O1) => O2,
) => <A>(fa: Encoder<O1, A>) => Encoder<O2, A> = f => fa => map_(fa, f);

export const contramap: <A, B>(
  f: (b: B) => A,
) => <O>(fa: Encoder<O, A>) => Encoder<O, B> = f => fa => contramap_(fa, f);

export const andThen: <O, B>(
  fbo: Encoder<O, B>,
) => <A>(fab: Encoder<B, A>) => Encoder<O, A> = fbo => fab =>
  andThen_(fab, fbo);

export const compose: <B, A>(
  fab: Encoder<B, A>,
) => <O>(fbo: Encoder<O, B>) => Encoder<O, A> = fab => fbo =>
  compose_(fbo, fab);

export const intersection: <O2, B>(
  fb: Encoder<O2, B>,
) => <O1, A>(fa: Encoder<O1, A>) => Encoder<O1 & O2, A & B> = fb => fa =>
  intersection_(fb, fa);

// -- Point-ful operators

export const map_ = <O1, O2, A>(
  fa: Encoder<O1, A>,
  f: (o: O1) => O2,
): Encoder<O2, A> => new Encoder(AndThen(fa.encode).andThen(f));

export const contramap_ = <O, A, B>(
  fa: Encoder<O, A>,
  f: (b: B) => A,
): Encoder<O, B> => new Encoder(AndThen(f).andThen(fa.encode));

export const andThen_ = <A, B, O>(
  fab: Encoder<B, A>,
  fbo: Encoder<O, B>,
): Encoder<O, A> => new Encoder(AndThen(fab.encode).andThen(fbo.encode));

export const compose_ = <O, B, A>(
  fbo: Encoder<O, B>,
  fab: Encoder<B, A>,
): Encoder<O, A> => new Encoder(AndThen(fab.encode).andThen(fbo.encode));

export const intersection_ = <O1, O2, A, B>(
  fa: Encoder<O1, A>,
  fb: Encoder<O2, B>,
): Encoder<O1 & O2, A & B> =>
  new Encoder(a => {
    const o1 = fa.encode(a);
    const o2 = fb.encode(a);
    if (typeof o1 === 'object' && typeof o2 === 'object' && !!o1 && !!o2) {
      return { ...o1, ...o2 } as any;
    }
    return o2 as any;
  });
