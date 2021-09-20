import { AnyK, pipe } from '@cats4ts/core';
import { Option } from '@cats4ts/cats-core/lib/data';

import * as PO from './operators';
import * as PC from './constructors';
import { FlatMapOutput, Pull, Translate, Uncons } from './algebra';
import { Chunk } from '../chunk';
import { FunctionK } from '@cats4ts/cats-core';

const P = { ...PO, ...PC };

export const uncons: <F extends AnyK, O>(
  pull: Pull<F, O, void>,
) => Pull<F, never, Option<[Chunk<O>, Pull<F, O, void>]>> = pull =>
  new Uncons(pull);

export const mapOutput: <O, P>(
  f: (o: O) => P,
) => <F extends AnyK>(pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  mapOutput_(pull, f);

export const mapFlatMapOutput: <F extends AnyK, O, P>(
  f: (o: O) => Pull<F, P, void>,
) => (pull: Pull<F, O, void>) => Pull<F, P, void> = f => pull =>
  flatMapOutput_(pull, f);

export const translate: <F extends AnyK, G extends AnyK>(
  nt: FunctionK<F, G>,
) => <O>(pull: Pull<F, O, void>) => Pull<G, O, void> = nt => pull =>
  translate_(pull, nt);

// -- Point-ful operators

export const mapOutput_ = <F extends AnyK, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => P,
): Pull<F, P, void> => {
  const go = (p: Pull<F, O, void>): Pull<F, P, void> =>
    pipe(
      p,
      uncons,
      P.flatMap(opt =>
        opt.fold(
          () => P.unit(),
          ([hd, tl]) => P.flatMap_(P.output(hd.map(f)), () => go(tl)),
        ),
      ),
    );

  return go(pull);
};

export const flatMapOutput_ = <F extends AnyK, O, P>(
  pull: Pull<F, O, void>,
  f: (o: O) => Pull<F, P, void>,
): Pull<F, P, void> => new FlatMapOutput(pull, f);

export const translate_ = <F extends AnyK, G extends AnyK, O>(
  pull: Pull<F, O, void>,
  nt: FunctionK<F, G>,
): Pull<G, O, void> => new Translate(pull, nt);
