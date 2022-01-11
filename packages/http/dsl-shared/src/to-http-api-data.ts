export const ToHttpApiDataTag = Symbol('@fp4ts/http/dsl/to-htt-api-data');
export type ToHttpApiDataTag = typeof ToHttpApiDataTag;

export interface ToHttpApiData<A> {
  toPathComponent(x: A): string;
  toQueryParameter(x: A): string;
}

export const ToHttpApiData = Object.freeze({
  fromUniversal: <A>(f: (x: A) => string): ToHttpApiData<A> => ({
    toPathComponent: f,
    toQueryParameter: f,
  }),
});
