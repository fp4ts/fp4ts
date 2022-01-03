// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { EitherT, Identity, Left, Right, Some } from '@fp4ts/cats';
import { DecoderT, DecodeFailure, DecodeResultT } from '@fp4ts/schema-core';
import { Schema, Constraining } from '@fp4ts/schema-kernel';

describe('DecoderT', () => {
  const IdM = Identity.Monad;

  describe('flatMapR', () => {
    it('should transform to success', () => {
      const r = DecoderT.string(IdM)
        .flatMapR(IdM)(() => DecodeResultT.success(IdM)('bar'))
        .decode('foo').value;

      expect(r).toEqual(Right('bar'));
    });

    it('should transform to failure', () => {
      const r = DecoderT.string(IdM)
        .flatMapR(IdM)(() => DecodeResultT.failure(IdM)(new DecodeFailure()))
        .decode('foo').value;

      expect(r).toEqual(Left(new DecodeFailure()));
    });

    it('should fallthrough on failure', () => {
      const r = DecoderT.string(IdM)
        .flatMapR(IdM)(() => DecodeResultT.failure(IdM)(new DecodeFailure()))
        .decode(42).value;

      expect(r).toEqual(Left(new DecodeFailure('string')));
    });
  });

  describe('handleError', () => {
    it('should recover from failure into success', () => {
      const r = DecoderT.string(IdM)
        .handleError(IdM)(() => Right('foo'))
        .decode(42).value;

      expect(r).toEqual(Right('foo'));
    });

    it('should recover from failure into failure', () => {
      const r = DecoderT.string(IdM)
        .handleError(IdM)(() => Left(new DecodeFailure('My failure')))
        .decode(42).value;

      expect(r).toEqual(Left(new DecodeFailure('My failure')));
    });

    it('should ignore recovery when successful', () => {
      const r = DecoderT.string(IdM)
        .handleError(IdM)(() => Left(new DecodeFailure('My failure')))
        .decode('bar').value;

      expect(r).toEqual(Right('bar'));
    });
  });

  describe('handleErrorWithR', () => {
    it('should recover from failure into success', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWithR(IdM)(() => DecodeResultT.success(IdM)('foo'))
        .decode(42).value;

      expect(r).toEqual(Right('foo'));
    });

    it('should recover from failure into failure', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWithR(IdM)(() =>
          DecodeResultT.failure(IdM)(new DecodeFailure('My failure')),
        )
        .decode(42).value;

      expect(r).toEqual(Left(new DecodeFailure('My failure')));
    });

    it('should ignore recovery when successful', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWithR(IdM)(() =>
          DecodeResultT.failure(IdM)(new DecodeFailure('My failure')),
        )
        .decode('bar').value;

      expect(r).toEqual(Right('bar'));
    });
  });

  describe('handleErrorWith', () => {
    it('should recover from failure into success', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWith(IdM)(() => DecoderT.succeed(IdM)('foo'))
        .decode(42).value;

      expect(r).toEqual(Right('foo'));
    });

    it('should recover from failure into failure', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWith(IdM)(() => DecoderT.failWith(IdM)('My failure'))
        .decode(42).value;

      expect(r).toEqual(Left(new DecodeFailure('My failure')));
    });

    it('should ignore recovery when successful', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWith(IdM)(() => DecoderT.failWith(IdM)('My failure'))
        .decode('bar').value;

      expect(r).toEqual(Right('bar'));
    });
  });

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
