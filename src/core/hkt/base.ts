import { URIS } from './kind';

export interface Auto {}

export interface Base<F extends URIS, C = Auto> {
  readonly _F: F;
  readonly _C: C;
}
