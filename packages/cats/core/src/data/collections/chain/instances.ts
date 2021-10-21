import { Eq } from '../../../eq';

import { Chain } from './algebra';
import { equals_ } from './operators';

export const chainEq = <A>(E: Eq<A>): Eq<Chain<A>> =>
  Eq.of({ equals: equals_(E) });
