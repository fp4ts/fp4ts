export function hole<T>(): T {
  throw new Error('Hole should never be called');
}
