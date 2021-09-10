export interface Auto {}

export interface Base<F, C = Auto> {
  readonly _F: F;
  readonly _C: C;
}
