// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { EitherT, Identity, Some } from '@fp4ts/cats';
import { DecoderT, DecodeFailure } from '@fp4ts/schema-core';
import { Schema, Constraining } from '@fp4ts/schema-kernel';

const personSchema = Schema.struct({
  first_name: Schema.string,
  last_name: Schema.string,
  address: Schema.struct({
    line1: Schema.string,
    line2: Schema.string.nullable,
    city: Schema.string,
    state: Schema.string.nullable,
    country: Schema.string,
  }).nullable,
});

const constrainingPersonSchema = <S>(S: Constraining<S>) =>
  S.struct({
    first_name: pipe(S.string, S.nonEmpty),
    last_name: pipe(S.string, S.nonEmpty),
    address: S.nullable(
      S.struct({
        line1: S.string,
        line2: pipe(S.string, S.nonEmpty, S.nullable),
        city: S.string,
        state: pipe(S.string, S.nonEmpty, S.nullable),
        country: S.string,
      }),
    ),
  });

describe('DecoderT', () => {
  const idPersonDecoder = personSchema
    .interpret(DecoderT.Schemable(Identity.Monad))
    .adapt(JSON.parse);

  const idConstrainingPersonDecoder = constrainingPersonSchema(
    DecoderT.Constraining(Identity.Monad),
  ).adapt(JSON.parse);

  it('should decode a valid person', () => {
    const person = {
      first_name: '',
      last_name: '',
      address: { line1: '', line2: null, city: '', state: '', country: '' },
    };

    const r = idPersonDecoder.decode(JSON.stringify(person));

    expect(r).toEqual(EitherT.right(Identity.Applicative)(person));
  });

  it('should fail on an invalid person', () => {
    const person = {
      first_name: '',
      last_name: '',
      address: { line1: '', line2: null, city: '', country: '' },
    };

    const r = idPersonDecoder.decode(JSON.stringify(person));

    expect(r).toEqual(
      EitherT.left(Identity.Applicative)(
        new DecodeFailure(Some(`missing property 'state' at key 'address'`)),
      ),
    );
  });

  it('should fail on an invalid constraining person', () => {
    const person = {
      first_name: '',
      last_name: '',
      address: { line1: '', line2: null, city: '', country: '' },
    };

    const r = idConstrainingPersonDecoder.decode(JSON.stringify(person));

    expect(r).toEqual(
      EitherT.left(Identity.Applicative)(
        new DecodeFailure(Some(`non empty at key 'first_name'`)),
      ),
    );
  });
});
