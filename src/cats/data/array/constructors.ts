export const empty: Array<never> = [];

export const pure: <A>(a: A) => Array<A> = x => [x];

export const of: <A>(...xs: A[]) => A[] = (...xs) => xs;
