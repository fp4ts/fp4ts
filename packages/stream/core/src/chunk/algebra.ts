import { ok as assert } from 'assert';
import { Vector } from '@cats4ts/cats';

export abstract class Chunk<O> {
  readonly __void!: void;

  readonly _O!: () => O;

  abstract readonly size: number;
}

export class SingletonChunk<O> extends Chunk<O> {
  public readonly tag = 'singleton';
  public readonly size: number = 1;
  public constructor(public readonly value: O) {
    super();
  }
}

export class ArrayChunk<O> extends Chunk<O> {
  public readonly tag = 'array';
  public readonly size: number;
  public constructor(public readonly array: O[]) {
    super();
    assert(
      array.length > 0,
      'Array chunk cannot be instantiated with an empty array',
    );
    this.size = array.length;
  }
}

export class ArraySlice<O> extends Chunk<O> {
  public readonly tag = 'slice';
  public readonly size: number;
  public constructor(
    public readonly values: O[],
    public readonly offset: number,
    public readonly length: number,
  ) {
    super();
    assert(
      offset >= 0 &&
        offset <= values.length &&
        length > 0 &&
        length <= values.length &&
        offset + length <= values.length,
    );
    this.size = length;
  }
}

export class Queue<O> extends Chunk<O> {
  public readonly tag = 'queue';
  public constructor(
    public readonly queue: Vector<Chunk<O>>,
    public readonly size: number,
  ) {
    super();
  }
}

export const EmptyChunk = new (class EmptyChunk extends Chunk<never> {
  public readonly tag = 'empty';
  public readonly size: number = 0;
})();
export type EmptyChunk = typeof EmptyChunk;

export type View<O> =
  | SingletonChunk<O>
  | ArrayChunk<O>
  | ArraySlice<O>
  | Queue<O>
  | EmptyChunk;
export const view = <O>(_: Chunk<O>): View<O> => _ as any;
