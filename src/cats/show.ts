export interface Show<A> {
  readonly show: (a: A) => string;
}

export const Show = {
  fromToString: <A>(): Show<A> => ({
    show: x => `${x}`,
  }),
};

// HKT

export const URI = 'cats/show';
export type URI = typeof URI;

declare module '../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Show<A>;
  }
}
