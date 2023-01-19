// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { PassThrough, Readable, Writable } from 'stream';
import { Either, Option } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect';
import { Stream, text } from '@fp4ts/stream-core';
import {
  readReadable,
  readWritable,
  stdinLines,
  stdoutLines,
  toReadable,
  writeWritable,
} from '@fp4ts/stream-io';

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

  const _writeWritable =
    (ss: string[]) =>
    (w: Writable): IO<void> => {
      const sz = ss.length;
      const te = new TextEncoder();
      const go = (idx: number): IO<void> =>
        idx < sz
          ? IO.async_<void>(cb =>
              w.write(te.encode(ss[idx]), err =>
                cb(Option(err).toLeft(() => undefined as void)),
              ),
            ).flatMap(() => go(idx + 1))
          : IO.async_<void>(cb => w.end(() => cb(Either.rightUnit)));

      return go(0);
    };

  it('should write to writable and read the contents written', () =>
    fc.assert(
      fc.asyncProperty(fc.array(fc.string()), ss =>
        readWritable(IO.Async)(_writeWritable(ss))
          .through(text.utf8.decode())
          .compileConcurrent()
          .string.flatMap(res => IO(() => expect(res).toBe(ss.join(''))))
          .unsafeRunToPromise(),
      ),
    ));

  it('should convert stream to readable and read from it ', () =>
    fc.assert(
      fc.asyncProperty(fc.array(fc.string()), ss =>
        Stream.fromArray(ss)
          .through(text.utf8.encode())
          .through(toReadable(IO.Async))
          .flatMap(readable => readReadable(IO.Async)(IO.pure(readable)))
          .through(text.utf8.decode())
          .compileConcurrent()
          .string.flatMap(actual => IO(() => expect(actual).toBe(ss.join(''))))
          .unsafeRunToPromise(),
      ),
    ));

  describe('stdin/stdout', () => {
    it('should output values as to stdout', () =>
      fc.assert(
        fc.asyncProperty(fc.array(fc.string()), ss => {
          const td = new TextDecoder();
          const out: Uint8Array[] = [];
          const ps = new PassThrough();
          ps.on('data', c => out.push(c));

          jest.spyOn(process, 'stdout', 'get').mockReturnValue(ps as any);

          return Stream.fromArray(ss)
            .through(stdoutLines(IO.Async))
            .compileConcurrent()
            .drain.flatMap(() =>
              IO(() =>
                expect(out.map(c => td.decode(c)).join('')).toBe(
                  ss.map(x => `${x}\n`).join(''),
                ),
              ),
            )
            .unsafeRunToPromise();
        }),
      ));

    it('should read lines from stdin', () =>
      fc.assert(
        fc.asyncProperty(fc.array(fc.string()), ss => {
          ss = ss
            .map(s =>
              s
                .replace(/\r\n/gm, '<CRLF>')
                .replace(/\n/gm, '<LF>')
                .replace(/\r/gm, '<CR>'),
            )
            .filter(s => !!s.length);
          const te = new TextEncoder();

          const ps = new PassThrough({
            read() {
              this.push(te.encode(ss.join('\n')));
              this.push(null);
            },
          });

          jest.spyOn(process, 'stdin', 'get').mockReturnValue(ps as any);

          return stdinLines(IO.Async)
            .compileConcurrent()
            .toArray.flatMap(r => IO(() => expect(r).toEqual(ss)))
            .unsafeRunToPromise();
        }),
      ));
  });
});
