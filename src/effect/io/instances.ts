import {
  Functor,
  Apply,
  Monad,
  FlatMap,
  Applicative,
  MonadError,
} from '../../cats';
import { Concurrent } from '../kernel/concurrent';
import { MonadCancel } from '../kernel/monad-cancel';
import { Spawn } from '../kernel/spawn';

import { URI } from './algebra';
import { never, pure, throwError, uncancelable } from './constructors';
import {
  attempt,
  both_,
  bracketFull,
  bracketOutcome_,
  bracket_,
  finalize_,
  flatMap_,
  flatten,
  fork,
  handleErrorWith_,
  handleError_,
  map2_,
  map_,
  onCancel_,
  onError_,
  parSequence,
  parSequenceN_,
  parTraverseN_,
  parTraverse_,
  racePair_,
  race_,
  redeemWith_,
  redeem_,
} from './operators';

export const ioFunctor: Functor<URI> = {
  _URI: URI,
  map: fa => f => map_(fa, f),
};

export const ioParallelApply: Apply<URI> = {
  ...ioFunctor,
  ap: ff => fa => map2_(ff, fa, (f, a) => f(a)),
  map2: (fa, fb) => f => map2_(fa, fb, f),
  product: (fa, fb) => map2_(fa, fb, (a, b) => [a, b]),
  productL: (fa, fb) => map2_(fa, fb, a => a),
  productR: (fa, fb) => map2_(fa, fb, (_, b) => b),
};

export const ioParallelApplicative: Applicative<URI> = {
  ...ioParallelApply,
  pure: a => pure(a),
};

export const ioSequentialApply: Apply<URI> = {
  ...ioFunctor,
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: (fa, fb) => flatMap_(fa, a => map_(fb, () => a)),
  productR: (fa, fb) => flatMap_(fa, () => fb),
};

export const ioSequentialApplicative: Applicative<URI> = {
  ...ioSequentialApply,
  pure: pure,
};

export const ioFlatMap: FlatMap<URI> = {
  ...ioSequentialApply,
  flatMap: fa => f => flatMap_(fa, f),
  flatten: flatten,
};

export const ioMonad: Monad<URI> = {
  ...ioSequentialApplicative,
  ...ioFlatMap,
};

export const ioMonadError: MonadError<URI, Error> = {
  ...ioMonad,
  throwError: throwError,
  handleError: fa => h => handleError_(fa, h),
  handleErrorWith: fa => h => handleErrorWith_(fa, h),
  attempt: attempt,
  onError: fa => h => onError_(fa, h),
  redeem: fa => (h, f) => redeem_(fa, h, f),
  redeemWith: fa => (h, f) => redeemWith_(fa, h, f),
};

export const ioMonadCancel: MonadCancel<URI, Error> = {
  ...ioMonadError,
  uncancelable: uncancelable,
  onCancel: onCancel_,
  finalize: finalize_,
  bracket: fa => use => release => bracket_(fa, use, release),
  bracketOutcome: fa => use => release => bracketOutcome_(fa, use, release),
  bracketFull: acquire => use => release => bracketFull(acquire, use, release),
};

export const ioSpawn: Spawn<URI, Error> = {
  ...ioMonadCancel,
  applicative: ioParallelApplicative,
  fork: fork,
  never: never,
  suspend: null as any,
  racePair: racePair_,
  raceOutcome: null as any,
  race: race_,
  both: both_,
  bothOutcome: null as any,
};

export const ioConcurrent: Concurrent<URI, Error> = {
  ...ioSpawn,
  parTraverse: as => f => parTraverse_(as, f),
  parSequence: parSequence,

  parTraverseN: n => as => f => parTraverseN_(as, f, n),
  parSequenceN: n => fas => parSequenceN_(fas, n),
};
