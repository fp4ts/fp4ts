// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats';
import { Console, IO, IOF } from '@fp4ts/effect';
import { Algebra, Handler } from '@fp4ts/fused';

export function teletype<F>(
  F: Algebra<{ teletype: TeletypeF }, F>,
): Kind<F, [void]> {
  const T = Teletype.Syntax(F);

  return F.do(function* (_) {
    yield* _(T.printLn('What is your name?'));
    const name = yield* _(T.readLn);
    yield* _(T.printLn(`Hello ${name}!`));
  });
}

// -- Effect Definition

export abstract class Teletype<F, A> {
  private readonly _F!: <X>(_: Kind<F, [X]>) => Kind<F, [X]>;
  private readonly _A!: () => A;

  public abstract foldMap<G>(
    onRead: () => Kind<G, [string]>,
    onWrite: (s: string) => Kind<G, [void]>,
  ): Kind<G, [A]>;

  static Syntax<F>(F: Algebra<{ teletype: TeletypeF }, F>): TeletypeSyntax<F> {
    return {
      readLn: F.send('teletype')(new ReadLn()),
      printLn: line => F.send('teletype')(new PrintLn(line)),
    };
  }
}

export class ReadLn<F> extends Teletype<F, string> {
  public foldMap<G>(
    onRead: () => Kind<G, [string]>,
    onWrite: (s: string) => Kind<G, [void]>,
  ): Kind<G, [string]> {
    return onRead();
  }
}

export class PrintLn<F> extends Teletype<F, void> {
  public constructor(private readonly line: string) {
    super();
  }

  public foldMap<G>(
    onRead: () => Kind<G, [string]>,
    onWrite: (s: string) => Kind<G, [void]>,
  ): Kind<G, [void]> {
    return onWrite(this.line);
  }
}

// -- Syntax

interface TeletypeSyntax<F> {
  readLn: Kind<F, [string]>;
  printLn(line: string): Kind<F, [void]>;
}

// -- Effect carrier

export type TeletypeIOC<A> = IO<A>;
export const TeletypeIOC = Object.freeze({
  get Algebra(): Algebra<{ teletype: TeletypeF }, IOF> {
    const C = Console.make(IO.Async);
    return Algebra.of<{ teletype: TeletypeF }, IOF>({
      eff: <H, G, A>(
        H: Functor<H>,
        hdl: Handler<H, G, IOF>,
        { eff }: { tag: 'teletype'; eff: Teletype<G, A> },
        hu: Kind<H, [void]>,
      ): IO<Kind<H, [A]>> =>
        eff.foldMap<[IOF, H]>(
          () => C.readLine.map(line => H.map_(hu, () => line)),
          line => C.printLn(line).map(() => hu),
        ),

      ...IO.Monad,
    });
  },
});

// -- HKT

export interface TeletypeF extends TyK<[unknown, unknown]> {
  [$type]: Teletype<TyVar<this, 0>, TyVar<this, 1>>;
}

export interface TeletypeIOCF extends TyK<[unknown]> {
  [$type]: TeletypeIOC<TyVar<this, 0>>;
}
