/* eslint-disable @typescript-eslint/ban-types */

import { OrFix } from './fix';
import { CoercedURIS, URItoKind } from './hkt';

export type URIS = [URI<CoercedURIS, any>, ...URI<CoercedURIS, any>[]];

export interface URI<F extends CoercedURIS, C = {}> {
  readonly _F: F;
  readonly _C: C;
}

export type Kind<F, C, S, R, E, A> = F extends URIS
  ? F extends [any, ...infer Next]
    ? URItoKind<
        F[0]['_C'],
        OrFix<'S', F[0]['_C'], OrFix<'S', C, S>>,
        OrFix<'R', F[0]['_C'], OrFix<'R', C, R>>,
        OrFix<'E', F[0]['_C'], OrFix<'E', C, E>>,
        Next extends URIS ? Kind<Next, C, S, R, E, A> : A
      >[F[0]['_F']]
    : never
  : never;
