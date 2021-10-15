import { Pull } from '../pull';

export class Stream<F, A> {
  private readonly __void!: void;

  public constructor(public readonly pull: Pull<F, A, void>) {}
}
