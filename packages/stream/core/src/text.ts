// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Byte } from '@fp4ts/core';
import { Chunk } from './chunk';
import { Pull } from './pull';
import { Stream } from './stream';
import { Pipe } from './pipe';
import { ChainChunk } from './chunk/algebra';

const utf8BomSeq: Chunk<Byte> = Chunk(0xef as Byte, 0xbb as Byte, 0xbf as Byte);
export const text = Object.freeze({
  utf8: Object.freeze({
    decodeChunk: <F>(): Pipe<F, Chunk<Byte>, string> => {
      const td = new TextDecoder('utf-8');
      const continuationBytes = (b: Byte): number => {
        if ((b & 0x80) === 0x00)
          // ASCII byte
          return 0;
        else if ((b & 0xe0) === 0xc0)
          // leading byte of a 2 byte seq
          return 1;
        else if ((b & 0xf0) === 0xe0)
          // leading byte of a 3 byte seq
          return 2;
        else if ((b & 0xf8) === 0xf0)
          // leading byte of a 4 byte seq
          return 3;
        // continuation byte or garbage
        else return -1;
      };

      const lastIncompleteBytes = (bs: Byte[]): number => {
        const minIdx = Math.max(0, bs.length - 3);
        let idx = bs.length - 1;
        let counter = 0;
        let res = 0;
        while (minIdx <= idx) {
          const c = continuationBytes(bs[idx]);
          if (c >= 0) {
            if (c != counter) res = counter + 1;
            // exit the loop
            return res;
          }
          idx = idx - 1;
          counter = counter + 1;
        }
        return res;
      };

      const processSingleChunk = (
        outBuf: string[],
        buffer: Chunk<Byte>,
        nextBytes: Chunk<Byte>,
      ): Chunk<Byte> => {
        // if processing ASCII or largely ASCII buffer is often empty
        const allBytes = buffer.isEmpty
          ? nextBytes.toArray
          : [...buffer.toArray, ...nextBytes.toArray];

        const splitAt = allBytes.length - lastIncompleteBytes(allBytes);

        if (splitAt === allBytes.length) {
          // in the common case of ASCII chars
          // we are in this branch so the next buffer will
          // be empty
          outBuf.push(td.decode(new Uint8Array(allBytes)));
          return Chunk.empty;
        } else if (splitAt === 0) return Chunk.fromArray(allBytes);
        else {
          const tempBuf = new Uint8Array(allBytes);
          outBuf.push(td.decode(tempBuf.subarray(0, splitAt)));
          return Chunk.fromBuffer(tempBuf.subarray(splitAt));
        }
      };

      const doPull = (
        buf: Chunk<Byte>,
        pull: Pull<F, Chunk<Byte>, void>,
      ): Pull<F, string, void> =>
        pull.uncons.flatMap(opt =>
          opt.fold(
            () =>
              buf.nonEmpty
                ? Pull.output1(
                    Buffer.from(new Uint8Array(buf.toArray)).toString('utf-8'),
                  )
                : Pull.done(),

            ([byteChunks, tail]) => {
              const size = byteChunks.size;
              const outBuf: string[] = [];
              let buf1 = buf;
              for (let idx = 0; idx < size; idx++) {
                const nextBytes = byteChunks['!!'](idx);
                buf1 = processSingleChunk(outBuf, buf1, nextBytes);
              }
              return Pull.output(Chunk.fromArray(outBuf))['>>>'](() =>
                doPull(buf1, tail),
              );
            },
          ),
        );

      const processByteOrderMark = (
        buffer:
          | ChainChunk<Byte>
          | undefined /* or null which we use as an Optional type to avoid boxing */,
        pull: Pull<F, Chunk<Byte>, void>,
      ): Pull<F, string, void> =>
        pull.uncons1.flatMap(opt =>
          opt.fold(
            () =>
              buffer
                ? doPull(
                    Chunk.empty,
                    Pull.output(Chunk.fromArray(buffer.chunks.toArray)),
                  )
                : Pull.done(),
            ([hd, tl]) => {
              const newBuffer0 = buffer ?? Chunk.emptyChain;
              const newBuffer = newBuffer0.appendChunk(hd);

              if (newBuffer.size >= 3) {
                const rem = newBuffer.startsWith(utf8BomSeq)
                  ? (newBuffer.drop(3) as ChainChunk<Byte>)
                  : newBuffer;
                return doPull(
                  Chunk.empty,
                  Pull.output(Chunk.fromArray(rem.chunks.toArray))['>>>'](
                    () => tl,
                  ),
                );
              } else return processByteOrderMark(newBuffer, tl);
            },
          ),
        );

      return ins => processByteOrderMark(undefined, ins.pull).stream();
    },

    decode:
      <F>(): Pipe<F, Byte, string> =>
      is =>
        is.chunks.through(text.utf8.decodeChunk()),

    encodeChunk: <F>(): Pipe<F, string, Chunk<Byte>> => {
      const te = new TextEncoder();
      return s => s.mapChunks(c => c.map(s => Chunk.fromBuffer(te.encode(s))));
    },

    encode: <F>(): Pipe<F, string, Byte> => {
      const te = new TextEncoder();
      return s =>
        s.mapChunks(c => c.flatMap(s => Chunk.fromBuffer(te.encode(s))));
    },
  }),

  // https://github.com/dominictarr/split/blob/master/index.js
  lines: <F>(): Pipe<F, string, string> => {
    const matcher = /\r?\n/;
    const doPull = (
      trailing: string | undefined,
      pull: Pull<F, string, void>,
    ): Pull<F, string, void> =>
      pull.uncons.flatMap(opt =>
        opt.fold(
          () => (trailing != null ? Pull.output1(trailing) : Pull.done()),
          ([hd, tl]) => {
            const next = (trailing ?? '') + hd.toArray.join('');
            const lines = next.split(matcher);
            const nextTrailing = lines.pop();

            return Pull.output(Chunk.fromArray(lines))['>>>'](() =>
              doPull(nextTrailing, tl),
            );
          },
        ),
      );

    return is => Stream.defer(() => doPull(undefined, is.pull).stream());
  },
});
