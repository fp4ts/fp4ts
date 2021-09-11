/* eslint-disable @typescript-eslint/ban-types */

import { Auto } from './base';
import { OrFix } from './fix';
import { Empty } from './variance';
import { CoercedURIS, URItoKind } from './hkt';

export type URIS = [URI<CoercedURIS, any>, ...URI<CoercedURIS, any>[]];

export interface URI<F extends CoercedURIS, C = Auto> {
  readonly _F: F;
  readonly _C: C;
}

export type Kind<F extends URIS, C, S, R, E, A> = F extends [any, ...infer Next]
  ? URItoKind<
      F[0]['_C'],
      OrFix<'S', F[0]['_C'], OrFix<'S', C, S>>,
      OrFix<'R', F[0]['_C'], OrFix<'R', C, R>>,
      OrFix<'E', F[0]['_C'], OrFix<'E', C, E>>,
      Next extends URIS ? Kind<Next, C, S, R, E, A> : A
    >[F[0]['_F']]
  : never;

export type Kind1<F extends URIS, C, A> = Kind<
  F,
  C,
  Empty<C, 'S'>,
  Empty<C, 'R'>,
  Empty<C, 'E'>,
  A
>;

export type Kind2<F extends URIS, C, E, A> = Kind<
  F,
  C,
  Empty<C, 'S'>,
  Empty<C, 'R'>,
  E,
  A
>;

export type Kind3<F extends URIS, C, R, E, A> = Kind<
  F,
  C,
  Empty<C, 'S'>,
  R,
  E,
  A
>;

export type Kind4<F extends URIS, C, S, R, E, A> = Kind<F, C, S, R, E, A>;
