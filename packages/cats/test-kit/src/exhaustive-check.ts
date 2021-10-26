import { List } from '@fp4ts/cats-core/lib/data';
import { MiniInt } from './mini-int';

export class ExhaustiveCheck<A> {
  public constructor(public readonly allValues: List<A>) {}
}

export const miniInt = (): ExhaustiveCheck<MiniInt> =>
  new ExhaustiveCheck(MiniInt.values);

export const boolean = (): ExhaustiveCheck<boolean> =>
  new ExhaustiveCheck(List(false, true));

export const instance = <A>(xs: List<A>): ExhaustiveCheck<A> =>
  new ExhaustiveCheck(xs);

export const tuple2 = <A, B>(
  a: ExhaustiveCheck<A>,
  b: ExhaustiveCheck<B>,
): ExhaustiveCheck<[A, B]> =>
  instance(a.allValues.flatMap(a => b.allValues.map(b => [a, b] as [A, B])));

export const tuple3 = <A, B, C>(
  a: ExhaustiveCheck<A>,
  b: ExhaustiveCheck<B>,
  c: ExhaustiveCheck<C>,
): ExhaustiveCheck<[A, B, C]> =>
  instance(
    a.allValues.flatMap(a =>
      b.allValues.flatMap(b => c.allValues.map(c => [a, b, c] as [A, B, C])),
    ),
  );
