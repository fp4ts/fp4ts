/* eslint-disable @typescript-eslint/no-empty-interface */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface URItoKind<A> {}

type URIS = keyof URItoKind<any>;

export type Kind<F, A> = F extends URIS ? URItoKind<A>[F] : never | unknown;
