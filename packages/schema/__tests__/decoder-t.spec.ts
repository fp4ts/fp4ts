// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe, throwError } from '@fp4ts/core';
import { Identity, Left, Right } from '@fp4ts/cats';
import { DecoderT, DecodeFailure, DecodeResultT } from '@fp4ts/schema-core';
import { Constraining } from '@fp4ts/schema-kernel';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import fc from 'fast-check';

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
        .handleError(IdM)(() => 'foo')
        .decode(42).value;

      expect(r).toEqual(Right('foo'));
    });

    it('should ignore recovery when successful', () => {
      const r = DecoderT.string(IdM)
        .handleError(IdM)(() => throwError(new DecodeFailure('My failure')))
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

  describe('decoding', () => {
    const make_person = <S>(S: Constraining<S>) =>
      S.struct({
        first_name: pipe(S.string, S.nonEmpty),
        last_name: pipe(S.string, S.nonEmpty),
        address: pipe(
          S.struct({
            line1: pipe(S.string, S.nonEmpty),
            line2: pipe(S.string, S.nonEmpty, S.nullable),
            city: pipe(S.string, S.nonEmpty),
            zip: pipe(S.number, S.min(1000), S.max(10_000)),
            state: pipe(S.string, S.nonEmpty, S.nullable),
            country: pipe(S.literal('US', 'SK')),
          }),
        ),
      });

    const arbPerson = make_person(ArbitraryInstances.Constraining);
    const personDecoder = make_person(DecoderT.Constraining(IdM));

    it('should decode person with correct data', () => {
      fc.assert(
        fc.property(arbPerson, person =>
          expect(personDecoder.decode(person).value).toEqual(Right(person)),
        ),
        { numRuns: 20 },
      );
    });
  });
});