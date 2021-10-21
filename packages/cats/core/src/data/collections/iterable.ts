export interface Iterable<A> {
  readonly iterator: Iterator<A>;
  readonly reverseIterator: Iterator<A>;
  [Symbol.iterator](): Iterator<A>;
}
