import { Semigroup } from '../../semigroup';
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
  mapLeft_,
  map_,
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
    mapLeft<C>(f: (a: A) => C): Ior<C, B>;
    bimap<C, D>(f: (a: A) => C, g: (b: B) => D): Ior<C, D>;

    flatMap<AA>(
      S: Semigroup<AA>,
    ): <C>(this: Ior<AA, B>, f: (b: B) => Ior<AA, C>) => Ior<AA, C>;

    combine<AA, BB>(
      this: Ior<AA, BB>,
      SA: Semigroup<AA>,
      SB: Semigroup<BB>,
    ): (that: Ior<AA, BB>) => Ior<AA, BB>;

    fold<C>(
      onLeft: (a: A) => C,
      onRight: (b: B) => C,
      onBoth: (a: A, b: B) => C,
    ): C;
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
Ior.prototype.mapLeft = function (f) {
  return mapLeft_(this, f);
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

Ior.prototype.fold = function (onLeft, onRight, onBoth) {
  return fold_(this, onLeft, onRight, onBoth);
};
