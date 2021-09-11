import { Auto } from './base';
import { V } from './variance';

export type Param = 'F' | 'C' | 'S' | 'R' | 'E' | 'A';

export type OrFix<P extends Param, A, B> = A extends Fix<P, infer X> ? X : B;

export interface Fix<P extends Param, K> {
  Fix: {
    [p in P]: K;
  };
}

export type CleanParam<C, P extends Param> = C extends (
  | Auto
  | V<P, '#'>
  | V<P, '+'>
  | Fix<P, any>
) &
  infer X
  ? X
  : C;
