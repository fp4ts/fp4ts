export type Param = 'F' | 'C' | 'S' | 'R' | 'E' | 'A';

export type OrFix<P extends Param, A, B> = A extends Fix<P, infer X> ? X : B;

export interface Fix<P extends Param, K> {
  Fix: {
    [p in P]: K;
  };
}
