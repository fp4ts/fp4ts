// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Show } from '@fp4ts/cats';
import { LogMessage } from './log-message';

export function logFormat<A = unknown>(
  strings: TemplateStringsArray,
  ...xs: LogFormat<A>[]
): LogFormat<A> {
  let acc: LogFormat<A> = empty;
  let i = 0;
  let j = 0;

  while (i < strings.length && j < xs.length) {
    acc = concat(acc, text(strings[i++]), xs[j++]);
  }
  while (i < strings.length) {
    acc = concat(acc, text(strings[i++]));
  }
  while (j < strings.length) {
    acc = concat(acc, xs[j++]);
  }

  return acc;
}

type LogFormat<A = unknown> = (msg: LogMessage<A>) => string;
export const LogFormat = Object.freeze({
  get default(): LogFormat {
    return logFormat`timestamp: ${fixed(42, timestamp())} ${level} ${quoted(
      message(),
    )}`;
  },
});

// -- Constructors

export const empty: LogFormat = () => '';

export const text =
  (txt: string): LogFormat =>
  () =>
    txt;

export const timestamp =
  (format: (d: Date) => string = d => d.toISOString()): LogFormat =>
  ({ timestamp }) =>
    timestamp.map(format).getOrElse(() => '');

export const level: LogFormat = ({ level }) => level;

export const message =
  <A = unknown>(S: Show<A> = Show.fromToString<A>()): LogFormat<A> =>
  ({ message }) =>
    S.show(message);

export const context =
  (f: (ctx: Record<string, string>) => string): LogFormat =>
  ({ context }) =>
    f(context);

export const contextKey =
  (key: string): LogFormat =>
  ({ context }) =>
    context[key] ?? '';

export const newline: LogFormat = () => `\n`;

// -- Combinators

export const fixed =
  <A>(width: number, f: LogFormat<A>): LogFormat<A> =>
  msg =>
    f(msg).slice(0, width).padEnd(width);

export const bracketed =
  <A>(f: LogFormat<A>): LogFormat<A> =>
  msg =>
    `[${f(msg)}]`;

export const label =
  <A>(l: string, value: LogFormat<A>): LogFormat<A> =>
  msg =>
    `${l}: ${value(msg)}`;

export const quoted =
  <A>(f: LogFormat<A>): LogFormat<A> =>
  msg =>
    `"${f(msg)}"`;

export const concat =
  <A>(l: LogFormat<A>, ...rs: LogFormat<A>[]): LogFormat<A> =>
  msg =>
    [l(msg), rs.map(r => r(msg))].join('');

export const spaced =
  <A>(l: LogFormat<A>, ...rs: LogFormat<A>[]): LogFormat<A> =>
  msg =>
    [l(msg), rs.map(r => r(msg))].join(' ');
