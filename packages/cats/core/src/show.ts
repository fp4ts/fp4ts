/**
 * @category Type Class
 */
export interface Show<A> {
  readonly show: (a: A) => string;
}

export const Show = {
  fromToString: <A>(): Show<A> => ({
    show: x => `${x}`,
  }),
};
