import fc, { Arbitrary } from 'fast-check';
import { Option } from '@cats4ts/cats-core/lib/data';

export const cats4tsOption = <A>(arbA: Arbitrary<A>): Arbitrary<Option<A>> =>
  fc.option(arbA).map(Option.fromNullable);
