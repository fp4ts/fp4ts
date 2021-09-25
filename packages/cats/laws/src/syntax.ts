import { IsEq } from './results';

declare global {
  interface Object {
    '<=>'<A>(this: A, that: A): IsEq<A>;
  }
}

let patched = false;

export function patch(): void {
  if (patched || Object.prototype['<=>']) {
    return;
  }

  Object.defineProperty(Object.prototype, '<=>', {
    value<A>(this: A, that: A): IsEq<A> {
      return new IsEq(this, that);
    },
    enumerable: false,
    writable: true,
  });

  patched = true;
}

patch();
