import {
  IntersectionSchema,
  NullableSchema,
  Schema,
  UnionSchema,
} from './algebra';

export const nullable = <A>(sa: Schema<A>): Schema<A | null> =>
  new NullableSchema(sa);

export const union: <B>(sb: Schema<B>) => <A>(sa: Schema<A>) => Schema<A | B> =
  sb => sa =>
    union_(sa, sb);

export const intersection: <B>(
  sb: Schema<B>,
) => <A>(sa: Schema<A>) => Schema<A & B> = sb => sa => intersection_(sa, sb);

// -- Point-ful operators

export const union_ = <A, B>(sa: Schema<A>, sb: Schema<B>): Schema<A | B> =>
  new UnionSchema(sa, sb);

export const intersection_ = <A, B>(
  sa: Schema<A>,
  sb: Schema<B>,
): Schema<A & B> => new IntersectionSchema(sa, sb);
