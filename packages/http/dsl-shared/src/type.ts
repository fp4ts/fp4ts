import { Schema } from '@fp4ts/schema-kernel';

export const typeDef = <R extends string, A>(
  ref: R,
  schema: Schema<A>,
): Type<R, A> => ({ ref, schema });

export interface Type<R extends string, A> {
  ref: R;
  schema: Schema<A>;
}
