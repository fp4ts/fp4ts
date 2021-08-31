// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class List<A> {
  // @ts-ignore
  private readonly __void: void;
}

// HKT

export const URI = 'cats/data/list';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: List<A>;
  }
}

// Definitions

export class Cons<A> extends List<A> {
  public readonly tag = 'cons';
  public constructor(public readonly h: A, public readonly t: List<A>) {
    super();
  }
}

export const Nil = new (class Nil extends List<never> {
  public readonly tag = 'nil';
})();
export type Nil = typeof Nil;

export type View<A> = Cons<A> | Nil;

export const view = <A>(_: List<A>): View<A> => _ as any;
