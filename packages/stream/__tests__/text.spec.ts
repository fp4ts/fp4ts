import fc from 'fast-check';
import { Byte } from '@fp4ts/core';
import { Eq, List } from '@fp4ts/cats';
import { Stream, Chunk, text } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';

describe('Text Streams', () => {
  const td = new TextDecoder('utf-8');
  const getUtf8String = (bs: Chunk<Byte>) => td.decode(bs.toUint8Array());

  describe('utf8 encoding-decoding', () => {
    test('ascii identity', () =>
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer(1, 9),
          (string, chunkSize) =>
            Stream.pure(string)
              .through(text.utf8.encode())
              .chunkN(chunkSize, true)
              .unchunks.through(text.utf8.decode())
              .compile().string === string,
        ),
      ));

    test('unicode identity', () =>
      fc.assert(
        fc.property(
          fc.unicode(),
          fc.integer(1, 9),
          (string, chunkSize) =>
            Stream.pure(string)
              .through(text.utf8.encode())
              .chunkLimit(chunkSize)
              .unchunks.through(text.utf8.decode())
              .compile().string === string,
        ),
      ));

    test('full-unicode identity', () =>
      fc.assert(
        fc.property(
          fc.fullUnicode(),
          fc.integer(1, 9),
          (string, chunkSize) =>
            Stream.pure(string)
              .through(text.utf8.encode())
              .chunkLimit(chunkSize)
              .unchunks.through(text.utf8.decode())
              .compile().string === string,
        ),
      ));

    const checkBytes = (...is: number[]): void => {
      for (let i = 1; i < 6; i++) {
        const bytes = Chunk.fromBuffer(new Uint8Array(is));
        expect(
          Stream.emitChunk(bytes)
            .chunkLimit(i)
            .unchunks.through(text.utf8.decode())
            .compile().toList,
        ).toEqual(List(getUtf8String(bytes)));
      }
    };

    const checkBytes2 = (...is: number[]): void => {
      for (let i = 2; i < 6; i++) {
        const bytes = Chunk.fromBuffer(new Uint8Array(is));
        expect(
          Stream.emitChunk(bytes)
            .chunkLimit(i)
            .unchunks.through(text.utf8.decode())
            .compile().string,
        ).toEqual(getUtf8String(bytes));
      }
    };

    describe('single character decoding', () => {
      test('1 byte char', () => checkBytes(0x24)); // $
      test('2 byte char', () => checkBytes(0xc2, 0xa2)); // ¢
      test('3 byte char', () => checkBytes(0xe2, 0x82, 0xac)); // €
      test('4 byte char', () => checkBytes(0xf0, 0xa4, 0xad, 0xa2));

      test('incomplete 2 byte char', () => checkBytes(0xc2));
      test('incomplete 3 byte char', () => checkBytes(0xe2, 0x82));
      test('incomplete 4 byte char', () => checkBytes(0xf0, 0xa4, 0xad));
    });

    describe('Markus Kuhn UTF-8 stress tests', () => {
      // The next tests were taken from:
      // https://www.cl.cam.ac.uk/~mgk25/ucs/examples/UTF-8-test.txt

      describe('2.1 - First possible sequence of a certain length', () => {
        test('2.1.1', () => checkBytes(0x00));
        test('2.1.2', () => checkBytes(0xc2, 0x80));
        test('2.1.3', () => checkBytes(0xe0, 0xa0, 0x80));
        test('2.1.4', () => checkBytes(0xf0, 0x90, 0x80, 0x80));
        test('2.1.5', () => checkBytes2(0xf8, 0x88, 0x80, 0x80, 0x80));
        test('2.1.6', () => checkBytes2(0xfc, 0x84, 0x80, 0x80, 0x80, 0x80));
      });

      describe('2.2 - Last possible sequence of a certain length', () => {
        test('2.2.1', () => checkBytes(0x7f));
        test('2.2.2', () => checkBytes(0xdf, 0xbf));
        test('2.2.3', () => checkBytes(0xef, 0xbf, 0xbf));
        test('2.2.4', () => checkBytes(0xf7, 0xbf, 0xbf, 0xbf));
        test('2.2.5', () => checkBytes2(0xfb, 0xbf, 0xbf, 0xbf, 0xbf));
        test('2.2.6', () => checkBytes2(0xfd, 0xbf, 0xbf, 0xbf, 0xbf, 0xbf));
      });

      describe('2.3 - Other boundary conditions', () => {
        test('2.3.1', () => checkBytes(0xed, 0x9f, 0xbf));
        test('2.3.2', () => checkBytes(0xee, 0x80, 0x80));
        test('2.3.3', () => checkBytes(0xef, 0xbf, 0xbd));
        test('2.3.4', () => checkBytes(0xf4, 0x8f, 0xbf, 0xbf));
        test('2.3.5', () => checkBytes(0xf4, 0x90, 0x80, 0x80));
      });

      describe('3.1 - Unexpected continuation bytes', () => {
        test('3.1.1', () => checkBytes(0x80));
        test('3.1.2', () => checkBytes(0xbf));
      });

      describe('3.5 - Impossible bytes', () => {
        test('3.5.1', () => checkBytes(0xfe));
        test('3.5.2', () => checkBytes(0xff));
        test('3.5.3', () => checkBytes2(0xfe, 0xfe, 0xff, 0xff));
      });

      describe('4.1 - Examples of an overlong ASCII character', () => {
        test('4.1.1', () => checkBytes(0xc0, 0xaf));
        test('4.1.2', () => checkBytes(0xe0, 0x80, 0xaf));
        test('4.1.3', () => checkBytes(0xf0, 0x80, 0x80, 0xaf));
        test('4.1.4', () => checkBytes2(0xf8, 0x80, 0x80, 0x80, 0xaf));
        test('4.1.5', () => checkBytes2(0xfc, 0x80, 0x80, 0x80, 0x80, 0xaf));
      });

      describe('4.2 - Maximum overlong sequences', () => {
        test('4.2.1', () => checkBytes(0xc1, 0xbf));
        test('4.2.2', () => checkBytes(0xe0, 0x9f, 0xbf));
        test('4.2.3', () => checkBytes(0xf0, 0x8f, 0xbf, 0xbf));
        test('4.2.4', () => checkBytes2(0xf8, 0x87, 0xbf, 0xbf, 0xbf));
        test('4.2.5', () => checkBytes2(0xfc, 0x83, 0xbf, 0xbf, 0xbf, 0xbf));
      });

      describe('4.3 - Overlong representation of the NUL character', () => {
        test('4.3.1', () => checkBytes(0xc0, 0x80));
        test('4.3.2', () => checkBytes(0xe0, 0x80, 0x80));
        test('4.3.3', () => checkBytes(0xf0, 0x80, 0x80, 0x80));
        test('4.3.4', () => checkBytes2(0xf8, 0x80, 0x80, 0x80, 0x80));
        test('4.3.5', () => checkBytes2(0xfc, 0x80, 0x80, 0x80, 0x80, 0x80));
      });

      describe('5.1 - Single UTF-16 surrogates', () => {
        test('5.1.1', () => checkBytes(0xed, 0xa0, 0x80));
        test('5.1.2', () => checkBytes(0xed, 0xad, 0xbf));
        test('5.1.3', () => checkBytes(0xed, 0xae, 0x80));
        test('5.1.4', () => checkBytes(0xed, 0xaf, 0xbf));
        test('5.1.5', () => checkBytes(0xed, 0xb0, 0x80));
        test('5.1.6', () => checkBytes(0xed, 0xbe, 0x80));
        test('5.1.7', () => checkBytes(0xed, 0xbf, 0xbf));
      });

      describe('5.2 - Paired UTF-16 surrogates', () => {
        test('5.2.1', () => checkBytes2(0xed, 0xa0, 0x80, 0xed, 0xb0, 0x80));
        test('5.2.2', () => checkBytes2(0xed, 0xa0, 0x80, 0xed, 0xbf, 0xbf));
        test('5.2.3', () => checkBytes2(0xed, 0xad, 0xbf, 0xed, 0xb0, 0x80));
        test('5.2.4', () => checkBytes2(0xed, 0xad, 0xbf, 0xed, 0xbf, 0xbf));
        test('5.2.5', () => checkBytes2(0xed, 0xae, 0x80, 0xed, 0xb0, 0x80));
        test('5.2.6', () => checkBytes2(0xed, 0xae, 0x80, 0xed, 0xbf, 0xbf));
        test('5.2.7', () => checkBytes2(0xed, 0xaf, 0xbf, 0xed, 0xb0, 0x80));
        test('5.2.8', () => checkBytes2(0xed, 0xaf, 0xbf, 0xed, 0xbf, 0xbf));
      });

      describe('5.3 - Other illegal code positions', () => {
        test('5.3.1', () => checkBytes(0xef, 0xbf, 0xbe));
        test('5.3.2', () => checkBytes(0xef, 0xbf, 0xbf));
      });
    });
  });

  describe('lines', () => {
    const escapeCrLf = (s: string): string =>
      s
        .replace(/\r\n/gm, '<CRLF>')
        .replace(/\n/gm, '<LF>')
        .replace(/\r/gm, '<CR>');

    test('newlines appear in between chunks', () =>
      fc.assert(
        fc.property(A.fp4tsPureStreamGenerator(fc.string()), lines0 => {
          const lines = lines0.map(escapeCrLf);
          const x = lines
            .intersperse('\n')
            .through(text.lines())
            .toList.equals(Eq.primitive, lines.toList);
          const y = lines
            .intersperse('\r\n')
            .through(text.lines())
            .toList.equals(Eq.primitive, lines.toList);
          return x && y;
        }),
      ));

    test('single string', () =>
      fc.assert(
        fc.property(A.fp4tsPureStreamGenerator(fc.string()), lines0 => {
          const lines = lines0.map(escapeCrLf);
          if (lines.toList.nonEmpty) {
            const s = lines.intersperse('\r\n').compile().string;
            return Stream.pure(s)
              .through(text.lines())
              .toList.equals(Eq.primitive, lines.toList);
          } else {
            return true;
          }
        }),
      ));
  });
});
