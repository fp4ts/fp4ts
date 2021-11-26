import { List } from '../list';

export class Queue<A> {
  private readonly __void!: void;
  public constructor(
    public readonly _in: List<A>,
    public readonly _out: List<A>,
  ) {}
}
