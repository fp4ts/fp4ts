import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { pure } from './constructors';
import {
  identityApplicative,
  identityApply,
  identityFlatMap,
  identityFunctor,
  identityMonad,
} from './instances';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Identity<A> {
  // @ts-ignore
  private readonly __void: void;

  public constructor(public readonly get: A) {}

  public static pure<A>(a: A): Identity<A> {
    return pure(a);
  }

  public static readonly unit: Identity<void> = pure(undefined);

  // -- Instances

  public static get Functor(): Functor<URI> {
    return identityFunctor();
  }

  public static get Apply(): Apply<URI> {
    return identityApply();
  }

  public static get Applicative(): Applicative<URI> {
    return identityApplicative();
  }

  public static get FlatMap(): FlatMap<URI> {
    return identityFlatMap();
  }

  public static get Monad(): Monad<URI> {
    return identityMonad();
  }
}

// HKT

export const URI = 'cats/data/id';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Identity<A>;
  }
}
