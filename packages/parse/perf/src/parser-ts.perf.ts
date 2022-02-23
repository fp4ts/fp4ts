import * as C from 'parser-ts/lib/char';
import * as P from 'parser-ts/lib/Parser';
import * as S from 'parser-ts/Stream';
import { pipe } from '@fp4ts/core';

const chainl1 =
  <A>(op: P.Parser<string, (x: A) => (y: A) => A>) =>
  (p: P.Parser<string, A>): P.Parser<string, A> => {
    const rest = P.many(P.ap(p)(op));
    return pipe(
      p,
      P.bindTo('x'),
      P.bind('rest', () => rest),
      P.map(({ x, rest }) => rest.reduce((ac, f) => f(ac), x)),
    );
  };

const number = pipe(
  P.many1(C.digit),
  P.map(xs => parseInt(xs.join(''))),
);
const expr = pipe(
  number,
  chainl1(P.map(() => (x: number) => (y: number) => x + y)(C.char('+'))),
);

const input = '1' + '+1'.repeat(50_000);

const start = Date.now();
console.log(expr(S.stream(input.split(''))));
const end = Date.now();

console.log(end - start);
