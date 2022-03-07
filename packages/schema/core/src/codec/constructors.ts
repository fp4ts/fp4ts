// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, lazyVal } from '@fp4ts/core';
import { Literal } from '@fp4ts/schema-kernel';
import { Decoder } from '../decoder-t';
import { Encoder } from '../encoder';
import { Codec } from './algebra';
import { OutputOf, TypeOf } from './types';

export const make = <I, O, A>(
  e: Encoder<O, A>,
  d: Decoder<I, A>,
): Codec<I, O, A> => new Codec(e, d);

export const fromDecoder = <I, A>(d: Decoder<I, A>): Codec<I, A, A> =>
  make(Encoder.lift(id), d);

export const literal = <A extends [Literal, ...Literal[]]>(
  ...xs: A
): Codec<unknown, A[number], A[number]> =>
  new Codec(Encoder.lift(id), Decoder.literal(...xs));

export const boolean: Codec<unknown, boolean, boolean> = new Codec(
  Encoder.lift(id),
  Decoder.boolean,
);
export const number: Codec<unknown, number, number> = new Codec(
  Encoder.lift(id),
  Decoder.number,
);
export const string: Codec<unknown, string, string> = new Codec(
  Encoder.lift(id),
  Decoder.string,
);
export const nullType: Codec<unknown, null, null> = new Codec(
  Encoder.lift(id),
  Decoder.null,
);

export const array = <O, A>(
  c: Codec<unknown, O, A>,
): Codec<unknown, O[], A[]> => {
  const c0 = c as Codec<unknown, O, A>;
  return new Codec(Encoder.array(c0.toEncoder), Decoder.array(c0.toDecoder));
};

export const record = <O, A>(
  c: Codec<unknown, O, A>,
): Codec<unknown, Record<string, O>, Record<string, A>> => {
  const c0 = c as Codec<unknown, O, A>;
  return new Codec(Encoder.record(c0.toEncoder), Decoder.record(c0.toDecoder));
};

export const product = <P extends Codec<unknown, any, any>[]>(
  ...fs: P
): Codec<
  unknown,
  { [k in keyof P]: OutputOf<P[k]> },
  { [k in keyof P]: TypeOf<P[k]> }
> => {
  const es = fs.map(f => (f as Codec<any, any, any>).toEncoder) as {
    [k in keyof P]: Encoder<OutputOf<P[k]>, TypeOf<P[k]>>;
  };
  const ds = fs.map(f => (f as Codec<any, any, any>).toDecoder) as {
    [k in keyof P]: Decoder<unknown, TypeOf<P[k]>>;
  };

  return new Codec<
    unknown,
    { [k in keyof P]: OutputOf<P[k]> },
    { [k in keyof P]: TypeOf<P[k]> }
  >(Encoder.product(...es) as any, Decoder.product(...ds) as any);
};

export const struct = <P extends Record<string, Codec<any, any, any>>>(
  fs: P,
): Codec<
  unknown,
  { [k in keyof P]: OutputOf<P[k]> },
  { [k in keyof P]: TypeOf<P[k]> }
> => {
  const keys = Object.keys(fs) as (keyof P)[];
  const es = keys.reduce(
    (acc, k) => ({ ...acc, [k]: (fs as any)[k].toEncoder }),
    {} as { [k in keyof P]: Encoder<OutputOf<P[k]>, TypeOf<P[k]>> },
  );
  const ds = keys.reduce(
    (acc, k) => ({ ...acc, [k]: (fs as any)[k].toDecoder }),
    {} as { [k in keyof P]: Decoder<unknown, TypeOf<P[k]>> },
  );

  return new Codec<
    unknown,
    { [k in keyof P]: OutputOf<P[k]> },
    { [k in keyof P]: TypeOf<P[k]> }
  >(Encoder.struct(es) as any, Decoder.struct(ds) as any);
};

export const sum =
  <T extends string>(tag: T) =>
  <P extends Record<string, Codec<any, any, any>>>(
    fs: P,
  ): Codec<unknown, OutputOf<P[keyof P]>, TypeOf<P[keyof P]>> => {
    const keys = Object.keys(fs) as (keyof P)[];
    const es = keys.reduce(
      (acc, k) => ({ ...acc, [k]: (fs as any)[k].toEncoder }),
      {} as Record<string, Encoder<any, any>>,
    );
    const ds = keys.reduce(
      (acc, k) => ({ ...acc, [k]: (fs as any)[k].toDecoder }),
      {} as Record<string, Decoder<any, any>>,
    );
    return new Codec(Encoder.sum(tag)(es), Decoder.sum(tag)(ds));
  };

export const defer = <I, O, A>(thunk: () => Codec<I, O, A>): Codec<I, O, A> => {
  const t = lazyVal(thunk) as () => Codec<I, O, A>;
  return new Codec(
    Encoder.defer(() => t().toEncoder),
    Decoder.defer(() => t().toDecoder),
  );
};
