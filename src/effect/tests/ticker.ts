export interface Ticker {
  tickOne(): boolean;
  tick(ms: number): void;
  tickAll(untilTime?: number): void;
}
