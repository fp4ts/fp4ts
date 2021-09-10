export interface Show<A> {
  readonly show: (a: A) => string;
}

export const Show = {
  fromToString: <A>(): Show<A> => ({
    show: x => `${x}`,
  }),
};

// HKT

export const ShowURI = 'cats/show';
export type ShowURI = typeof ShowURI;

declare module '../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [ShowURI]: Show<A>;
  }
}
