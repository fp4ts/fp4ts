import { ok as assert } from 'assert';

export abstract class HashMap<K, V> {
  private readonly __void!: void;
}

export class Inner<K, V> extends HashMap<K, V> {
  public readonly tag = 'inner';
  public constructor(public readonly children: HashMap<K, V>[]) {
    super();
  }
}

export type Bucket<K, V> = [number, K, V];
export class Leaf<K, V> extends HashMap<K, V> {
  public readonly tag = 'leaf';
  public constructor(public readonly buckets: Bucket<K, V>[]) {
    super();
    assert(this.buckets.length > 0, 'Leaf cannot be empty');
  }
}

export const Empty = new (class Empty extends HashMap<never, never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

export type Node<K, V> = (Inner<K, V> | Leaf<K, V> | Empty) & HashMap<K, V>;
export const toNode = <K, V>(_: HashMap<K, V>): Node<K, V> => _ as any;
