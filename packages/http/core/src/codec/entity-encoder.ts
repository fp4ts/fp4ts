import { Encoder } from '@fp4ts/schema';
import { Entity } from '../entity';
import { Headers } from '../headers';

export class EntityEncoder<F, A> {
  public constructor(
    private readonly encoder: Encoder<Entity<F>, A>,
    public readonly headers: Headers,
  ) {}

  public toEntity(a: A): Entity<F> {
    return this.encoder.encode(a);
  }

  public contramap<AA>(f: (a: AA) => A): EntityEncoder<F, AA> {
    return new EntityEncoder(this.encoder.contramap(f), this.headers);
  }
}
