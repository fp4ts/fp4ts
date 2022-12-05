// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Compare, Left, List, Right } from '@fp4ts/cats';
import { SourcePosition } from './source-position';

export class ParseError {
  public static empty(sp: SourcePosition): ParseError {
    return new ParseError(sp, []);
  }

  public static unexpected(sp: SourcePosition, msg: string): ParseError {
    return new ParseError(sp, [Message.SysUnexpected(msg)]);
  }

  public constructor(
    public readonly pos: SourcePosition,
    public readonly msgs: Message[],
  ) {}

  public get isEmpty(): boolean {
    return this.msgs.length === 0;
  }
  public get nonEmpty(): boolean {
    return !this.isEmpty;
  }

  public withPosition(pos: SourcePosition): ParseError {
    return new ParseError(pos, this.msgs);
  }

  public withMessage(msg: Message): ParseError {
    return new ParseError(this.pos, [
      msg,
      ...this.msgs.filter(m => m.tag !== msg.tag),
    ]);
  }

  public addMessage(msg: Message): ParseError {
    return new ParseError(this.pos, [...this.msgs, msg]);
  }

  public withMessages(msgs: Message[]): ParseError {
    return new ParseError(this.pos, msgs);
  }

  public merge(that: ParseError): ParseError {
    if (that.isEmpty && this.nonEmpty) return this;
    if (this.isEmpty && that.nonEmpty) return that;
    switch (this.pos.compare(that.pos)) {
      case Compare.EQ:
        return new ParseError(this.pos, [...this.msgs, ...that.msgs]);
      case Compare.LT:
        return that;
      case Compare.GT:
        return this;
    }
  }

  public toString(): string {
    const msgs = formatErrorMessages(
      'or',
      'unknown parse error',
      'expecting',
      'unexpected',
      'end of input',
      List.fromArray(this.msgs),
    );
    return `${this.pos}\n${msgs}`;
  }
}

export type Message =
  | { tag: 'sys-unexpected'; value: string }
  | { tag: 'unexpected'; value: string }
  | { tag: 'expected'; value: string }
  | { tag: 'message'; value: string };
export const Message = Object.freeze({
  SysUnexpected: (value: string): Message => ({ tag: 'sys-unexpected', value }),
  Unexpected: (value: string): Message => ({ tag: 'unexpected', value }),
  Expected: (value: string): Message => ({ tag: 'expected', value }),
  Raw: (value: string): Message => ({ tag: 'message', value }),
});

function formatErrorMessages(
  msgOr: string,
  msgUnknown: string,
  msgExpecting: string,
  msgUnExpected: string,
  msgEndOfInput: string,
  msgs: List<Message>,
): string {
  function formatMany(pre: string, msgs: List<Message>): string {
    const ms = clean(msgs.map(({ value }) => value));
    if (ms.isEmpty) return '';

    return pre === '' ? commasOr(ms) : `${pre} ${commasOr(ms)}`;
  }

  function commasOr(ms: List<string>): string {
    return ms.uncons.fold(
      () => '',
      ([hd, tl]) =>
        tl.isEmpty
          ? hd
          : `${tl.prepend(hd).init.toArray.join(', ')} ${msgOr} ${tl.last}`,
    );
  }

  function clean(msgs: List<string>): List<string> {
    const set = new Set<string>();
    return msgs
      .filter(s => s !== '')
      .foldLeft(List.empty as List<string>, (acc, next) => {
        if (set.has(next)) return acc;
        set.add(next);
        return acc.prepend(next);
      }).reverse;
  }

  if (msgs.isEmpty) return msgUnknown;

  const [sysUnExpect, msgs1] = msgs.partitionWith(msg =>
    msg.tag === 'sys-unexpected' ? Left(msg) : Right(msg),
  );
  const [unExpect, msgs2] = msgs1.partitionWith(msg =>
    msg.tag === 'unexpected' ? Left(msg) : Right(msg),
  );
  const [expect, messages] = msgs2.partitionWith(msg =>
    msg.tag === 'expected' ? Left(msg) : Right(msg),
  );

  const formatExpect = formatMany(msgExpecting, expect);
  const formatUnExpect = formatMany(msgUnExpected, unExpect);
  const formatSysUnExpect =
    unExpect.nonEmpty || sysUnExpect.isEmpty
      ? ''
      : sysUnExpect.head.value === ''
      ? `${msgUnExpected} ${msgEndOfInput}`
      : `${msgUnExpected} ${sysUnExpect.head.value}`;
  const formatMessages = formatMany('', messages);

  return clean(
    List(formatSysUnExpect, formatUnExpect, formatExpect, formatMessages),
  ).toArray.join('\n');
}
