export const ElementTag = '@fp4ts/http/dsl-shared/ElementTag';
export type ElementTag = typeof ElementTag;

export interface ApiElement<T extends string> {
  [ElementTag]: T;
}
