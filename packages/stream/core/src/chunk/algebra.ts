import { ok as assert } from 'assert';

export abstract class Chunk<O> {
  readonly __void!: void;
}

export class SingletonChunk<O> extends Chunk<O> {
  public readonly tag = 'singleton';
  public constructor(public readonly value: O) {
    super();
  }
}

export class ArrayChunk<O> extends Chunk<O> {
  public readonly tag = 'array';
  public constructor(public readonly array: O[]) {
    super();
    assert(
      array.length > 0,
      'Array chunk cannot be instantiated with an empty array',
    );
  }
}

export class ArraySlice<O> extends Chunk<O> {
  public readonly tag = 'slice';
  public constructor(
    public readonly values: O[],
    public readonly offset: number,
    public readonly length: number,
  ) {
    super();
    assert(
      offset >= 0 &&
        offset <= values.length &&
        length >= 0 &&
        length <= values.length &&
        offset + length <= values.length,
    );
  }
}

export const EmptyChunk = new (class EmptyChunk extends Chunk<never> {
  public readonly tag = 'empty';
})();
export type EmptyChunk = typeof EmptyChunk;

export type View<O> =
  | SingletonChunk<O>
  | ArrayChunk<O>
  | ArraySlice<O>
  | EmptyChunk;
export const view = <O>(_: Chunk<O>): View<O> => _ as any;
