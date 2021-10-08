export const singleton = <A>(x: A): Iterator<A> => {
  let done = false;
  return {
    next: () => {
      if (done) return { value: undefined, done: true };
      done = true;
      return { value: x, done: false };
    },
  };
};

export const pure = <A>(x: A): Iterator<A> => singleton(x);

export const empty: Iterator<never> = {
  next: () => ({ value: undefined, done: true }),
};

export const of = <A>(...xs: A[]): Iterator<A> => xs[Symbol.iterator]();

export const lift = <A>(next: () => IteratorResult<A>): Iterator<A> => ({
  next,
});

export const fromArray = <A>(xs: A[]): Iterator<A> => xs[Symbol.iterator]();
