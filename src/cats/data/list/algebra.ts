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
  public constructor(public readonly _head: A, public readonly _tail: List<A>) {
    super();
  }

  public override toString(): string {
    return `${this._head} :: ${this._tail}`;
  }
}

export const Nil = new (class Nil extends List<never> {
  public readonly tag = 'nil';
  public override toString(): string {
    return 'Nil';
  }
})();
export type Nil = typeof Nil;

export type View<A> = Cons<A> | Nil;

export const view = <A>(_: List<A>): View<A> => _ as any;
