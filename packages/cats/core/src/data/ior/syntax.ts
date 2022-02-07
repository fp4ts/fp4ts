// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Semigroup } from '@fp4ts/cats-kernel';
import { Option } from '../option';
import { Either } from '../either';
import { Ior } from './algebra';
import {
  bimap_,
  combine_,
  flatMap_,
  fold_,
  getLeft,
  getOnlyBoth,
  getOnlyLeft,
  getOnlyLeftOrRight,
  getOnlyRight,
  getRight,
  isBoth,
  isLeft,
  isRight,
  leftMap_,
  map_,
  merge,
  mergeWith_,
  pad,
  swapped,
  toEither,
  toOption,
} from './operators';

declare module './algebra' {
  interface Ior<A, B> {
    readonly isLeft: boolean;
    readonly isRight: boolean;
    readonly isBoth: boolean;

    readonly swapped: Ior<B, A>;

    readonly left: Option<A>;
    readonly right: Option<B>;

    readonly onlyLeft: Option<A>;
    readonly onlyRight: Option<B>;
    readonly onlyLeftOrRight: Option<Either<A, B>>;
    readonly onlyBoth: Option<[A, B]>;

    readonly toOption: Option<B>;
    readonly toEither: Either<A, B>;

    readonly pad: [Option<A>, Option<B>];

    map<D>(g: (b: B) => D): Ior<A, D>;
    leftMap<C>(f: (a: A) => C): Ior<C, B>;
    bimap<C, D>(f: (a: A) => C, g: (b: B) => D): Ior<C, D>;

    flatMap<AA>(
      S: Semigroup<AA>,
    ): <C>(this: Ior<AA, B>, f: (b: B) => Ior<AA, C>) => Ior<AA, C>;

    combine<AA, BB>(
      this: Ior<AA, BB>,
      SA: Semigroup<AA>,
      SB: Semigroup<BB>,
    ): (that: Ior<AA, BB>) => Ior<AA, BB>;

    merge<AA>(this: Ior<AA, AA>, S: Semigroup<AA>): AA;
    mergeWith<AA>(this: Ior<AA, AA>, f: (l: AA, r: AA) => AA): AA;

    fold<C1, C2 = C1, C3 = C2>(
      onLeft: (a: A) => C1,
      onRight: (b: B) => C2,
      onBoth: (a: A, b: B) => C3,
    ): C1 | C2 | C3;
  }
}

Object.defineProperty(Ior.prototype, 'isLeft', {
  get<A, B>(this: Ior<A, B>) {
    return isLeft(this);
  },
});
Object.defineProperty(Ior.prototype, 'isRight', {
  get<A, B>(this: Ior<A, B>) {
    return isRight(this);
  },
});
Object.defineProperty(Ior.prototype, 'isBoth', {
  get<A, B>(this: Ior<A, B>) {
    return isBoth(this);
  },
});
Object.defineProperty(Ior.prototype, 'swapped', {
  get<A, B>(this: Ior<A, B>) {
    return swapped(this);
  },
});
Object.defineProperty(Ior.prototype, 'left', {
  get<A, B>(this: Ior<A, B>) {
    return getLeft(this);
  },
});
Object.defineProperty(Ior.prototype, 'right', {
  get<A, B>(this: Ior<A, B>) {
    return getRight(this);
  },
});
Object.defineProperty(Ior.prototype, 'onlyLeft', {
  get<A, B>(this: Ior<A, B>) {
    return getOnlyLeft(this);
  },
});
Object.defineProperty(Ior.prototype, 'onlyRight', {
  get<A, B>(this: Ior<A, B>) {
    return getOnlyRight(this);
  },
});
Object.defineProperty(Ior.prototype, 'onlyLeftOrRight', {
  get<A, B>(this: Ior<A, B>) {
    return getOnlyLeftOrRight(this);
  },
});
Object.defineProperty(Ior.prototype, 'onlyBoth', {
  get<A, B>(this: Ior<A, B>) {
    return getOnlyBoth(this);
  },
});
Object.defineProperty(Ior.prototype, 'toOption', {
  get<A, B>(this: Ior<A, B>) {
    return toOption(this);
  },
});
Object.defineProperty(Ior.prototype, 'toEither', {
  get<A, B>(this: Ior<A, B>) {
    return toEither(this);
  },
});
Object.defineProperty(Ior.prototype, 'pad', {
  get<A, B>(this: Ior<A, B>) {
    return pad(this);
  },
});

Ior.prototype.map = function (g) {
  return map_(this, g);
};
Ior.prototype.leftMap = function (f) {
  return leftMap_(this, f);
};
Ior.prototype.bimap = function (f, g) {
  return bimap_(this, f, g);
};

Ior.prototype.flatMap = function (S) {
  return f => flatMap_(S)(this, f);
};

Ior.prototype.combine = function (SA, SB) {
  return that => combine_(SA, SB)(this, that);
};

Ior.prototype.merge = function (S) {
  return merge(S)(this);
};
Ior.prototype.mergeWith = function (f) {
  return mergeWith_(this, f);
};

Ior.prototype.fold = function (onLeft, onRight, onBoth) {
  return fold_(this, onLeft, onRight, onBoth);
};
