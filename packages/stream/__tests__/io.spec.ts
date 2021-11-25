import fc from 'fast-check';
import { PassThrough, Readable } from 'stream';
import { IO } from '@fp4ts/effect';
import { Stream, text } from '@fp4ts/stream-core';
import { readReadable, writeWritable } from '@fp4ts/stream-io';

describe('io', () => {
  const createReadableFromString =
    (s: string, chunkSize: number = Infinity): (() => Readable) =>
    () => {
      const te = new TextEncoder();
      const r = new Readable();
      while (s.length) {
        r.push(te.encode(s.slice(0, chunkSize)));
        s = s.slice(chunkSize);
      }
      r.push(null);
      return r;
    };

  it('should read and decode contents of Readable', () =>
    fc.assert(
      fc.asyncProperty(
        fc.string(),
        fc.nat().filter(n => n > 0),
        (s, n) =>
          readReadable(IO.Async)(IO.delay(createReadableFromString(s, n)))
            .through(text.utf8.decode())
            .compileConcurrent()
            .string.flatMap(r => IO(() => expect(r).toBe(s)))
            .unsafeRunToPromise(),
      ),
    ));

  it('should pass stream contents to a writable', () =>
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.string()),
        fc.nat().filter(n => n > 0),
        (ss, n) => {
          const expected = ss.join('');
          const chunks: Uint8Array[] = [];
          const writable = new PassThrough();
          writable.on('data', c => chunks.push(c));

          return Stream.fromArray(ss)
            .chunkLimit(n)
            .unchunks.through(text.utf8.encode())
            .through(writeWritable(IO.Async)(IO.pure(writable)))
            .compileConcurrent()
            .drain.flatMap(() =>
              IO(() => {
                const td = new TextDecoder();
                const actual = chunks.map(c => td.decode(c)).join('');
                expect(actual).toBe(expected);
              }),
            )
            .unsafeRunToPromise();
        },
      ),
    ));
});
