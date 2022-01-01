import { IntersectionSchema, NullableSchema, Schema } from './algebra';

export const nullable = <A>(sa: Schema<A>): Schema<A | null> =>
  new NullableSchema(sa);

export const intersection: <B>(
  sb: Schema<B>,
) => <A>(sa: Schema<A>) => Schema<A & B> = sb => sa => intersection_(sa, sb);

// -- Point-ful operators

export const intersection_ = <A, B>(
  sa: Schema<A>,
  sb: Schema<B>,
): Schema<A & B> => new IntersectionSchema(sa, sb);
