/* eslint-disable @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars */

export interface URItoKind<A> {}

type URIS = keyof URItoKind<any>;

export type Kind<F, A> = F extends URIS ? URItoKind<A>[F] : never | unknown;

export interface URItoKind2<E, A> {}

type URIS2 = keyof URItoKind2<any, any>;

export type Kind2<F, E, A> = F extends URIS2
  ? URItoKind2<E, A>[F]
  : never | unknown;
