// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fr, fr0 } from '@fp4ts/sql-core';

describe('Fragment', () => {
  const a = 42;
  const b = 'two';

  it('should substitute placeholders', () => {
    expect(fr`foo ${a} ${b} bar`.sql).toBe('foo ? ? bar ');
  });

  it('should concatenate the fragments', () => {
    expect(fr`foo`['+++'](fr`bar ${a} baz`).sql).toBe('foo bar ? baz ');
  });

  it('should concatenate the fragments without trailing space', () => {
    expect(fr`foo`['+++'](fr0`bar ${a} baz`).sql).toBe('foo bar ? baz');
  });

  it('should integrate fragment', () => {
    expect(fr`foo ${fr0`bar ${a} baz`}`.sql).toBe('foo bar ? baz ');
  });

  it('should strip default margin from the SQL', () => {
    expect(
      fr`SELECT foo
        | FROM bar
        | WHERE a = ${a} AND b = ${b}`.stripMargin().sql,
    ).toBe('SELECT foo\n FROM bar\n WHERE a = ? AND b = ? ');
  });

  it('should strip custom margin from the SQL', () => {
    expect(
      fr`SELECT foo
        ! FROM bar
        ! WHERE a = ${a} AND b = ${b}`.stripMargin('!').sql,
    ).toBe('SELECT foo\n FROM bar\n WHERE a = ? AND b = ? ');
  });

  it('should not strip characters outside of the margin position', () => {
    expect(
      fr`SELECT foo || baz
        | FROM bar
        | WHERE a = ${a} AND b = ${b}`.stripMargin().sql,
    ).toBe('SELECT foo || baz\n FROM bar\n WHERE a = ? AND b = ? ');
  });
});
