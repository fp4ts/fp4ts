// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe, throwError } from '@fp4ts/core';
import { Identity, Left, Right } from '@fp4ts/cats';
import {
  Decoder,
  DecoderT,
  DecodeFailure,
  DecodeResultT,
  DecodeResult,
} from '@fp4ts/schema-core';
import { Constraining } from '@fp4ts/schema-kernel';
import { ArbitraryInstances } from '@fp4ts/schema-test-kit';
import fc from 'fast-check';

describe('DecoderT', () => {
  const IdM = Identity.Monad;

  describe('flatMapR', () => {
    it('should transform to success', () => {
      const r = Decoder.string
        .flatMapR(() => DecodeResult.success('bar'))
        .decode('foo');

      expect(r).toEqual(Right('bar'));
    });

    it('should transform to failure', () => {
      const r = DecoderT.string(IdM)
        .flatMapR(IdM)(() => DecodeResultT.failure(IdM)(new DecodeFailure()))
        .decodeT('foo');

      expect(r).toEqual(Left(new DecodeFailure()));
    });

    it('should fallthrough on failure', () => {
      const r = Decoder.string
        .flatMapR(() => DecodeResult.failure(new DecodeFailure()))
        .decode(42);

      expect(r).toEqual(Left(new DecodeFailure('string')));
    });
  });

  describe('handleError', () => {
    it('should recover from failure into success', () => {
      const r = Decoder.string.handleError(() => 'foo').decode(42);

      expect(r).toEqual(Right('foo'));
    });

    it('should ignore recovery when successful', () => {
      const r = DecoderT.string(IdM)
        .handleError(IdM)(() => throwError(new DecodeFailure('My failure')))
        .decodeT('bar');

      expect(r).toEqual(Right('bar'));
    });
  });

  describe('handleErrorWithR', () => {
    it('should recover from failure into success', () => {
      const r = Decoder.string
        .handleErrorWithR(() => DecodeResult.success('foo'))
        .decode(42);

      expect(r).toEqual(Right('foo'));
    });

    it('should recover from failure into failure', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWithR(IdM)(() =>
          DecodeResultT.failure(IdM)(new DecodeFailure('My failure')),
        )
        .decodeT(42);

      expect(r).toEqual(Left(new DecodeFailure('My failure')));
    });

    it('should ignore recovery when successful', () => {
      const r = Decoder.string
        .handleErrorWithR(() =>
          DecodeResult.failure(new DecodeFailure('My failure')),
        )
        .decode('bar');

      expect(r).toEqual(Right('bar'));
    });
  });

  describe('handleErrorWith', () => {
    it('should recover from failure into success', () => {
      const r = Decoder.string
        .handleErrorWith(() => Decoder.succeed('foo'))
        .decode(42);

      expect(r).toEqual(Right('foo'));
    });

    it('should recover from failure into failure', () => {
      const r = DecoderT.string(IdM)
        .handleErrorWith(IdM)(() => DecoderT.failWith(IdM)('My failure'))
        .decodeT(42);

      expect(r).toEqual(Left(new DecodeFailure('My failure')));
    });

    it('should ignore recovery when successful', () => {
      const r = Decoder.string
        .handleErrorWith(() => Decoder.failWith('My failure'))
        .decode('bar');

      expect(r).toEqual(Right('bar'));
    });
  });

  describe('decoding', () => {
    const make_person = <S>(S: Constraining<S>) =>
      S.struct({
        first_name: S.nonEmpty(S.string),
        middle_name: pipe(S.nonEmpty(S.string), S.optional),
        last_name: S.nonEmpty(S.string),
        address: pipe(
          S.struct({
            line1: S.nonEmpty(S.string),
            line2: pipe(S.nonEmpty(S.string), S.nullable),
            city: S.nonEmpty(S.string),
            zip: pipe(S.number, S.min(1000), S.max(10_000)),
            state: pipe(S.nonEmpty(S.string), S.nullable),
            country: pipe(S.literal('US', 'SK')),
          }),
        ),
      });

    const arbPerson = make_person(ArbitraryInstances.Constraining);
    const personDecoder = make_person(DecoderT.Constraining(IdM));

    it('should decode person with correct data', () => {
      fc.assert(
        fc.property(arbPerson as any, person =>
          expect(personDecoder.decodeT(person)).toEqual(Right(person)),
        ),
        { numRuns: 20, unbiased: true },
      );
    });
  });
});
