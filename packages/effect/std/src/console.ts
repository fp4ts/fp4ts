// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import rl from 'readline';
import { Kind } from '@fp4ts/core';
import { FunctionK, Show, Some, Right } from '@fp4ts/cats';
import { Async } from '@fp4ts/effect-kernel';

export abstract class Console<F> {
  abstract readonly readLine: Kind<F, [string]>;

  abstract print<A>(a: A): Kind<F, [void]>;
  abstract print<A>(a: A, S?: Show<A>): Kind<F, [void]>;

  abstract printLn<A>(a: A): Kind<F, [void]>;
  abstract printLn<A>(a: A, S?: Show<A>): Kind<F, [void]>;

  abstract error<A>(a: A): Kind<F, [void]>;
  abstract error<A>(a: A, S?: Show<A>): Kind<F, [void]>;

  abstract errorLn<A>(a: A): Kind<F, [void]>;
  abstract errorLn<A>(a: A, S?: Show<A>): Kind<F, [void]>;

  public mapK<G>(nt: FunctionK<F, G>): Console<G> {
    return new TranslateConsole(this, nt);
  }

  public static make<F>(F: Async<F>): Console<F> {
    return new AsyncConsole(F);
  }
}

class AsyncConsole<F> extends Console<F> {
  public constructor(private readonly F: Async<F>) {
    super();
  }

  public get readLine(): Kind<F, [string]> {
    const { F } = this;
    return F.bracketFull(
      () =>
        F.delay(() =>
          rl.createInterface({ input: process.stdin, prompt: undefined }),
        ),
      _ =>
        F.async<string>(cb =>
          F.delay(() => {
            _.question('', answer => cb(Right(answer)));
            return Some(F.delay(() => _.close()));
          }),
        ),
      _ => F.delay(() => _.close()),
    );
  }

  public print<A>(a: A, S: Show<A> = Show.fromToString()): Kind<F, [void]> {
    return this.F.delay(() => {
      process.stdout.write(S.show(a));
    });
  }

  public printLn<A>(a: A, S: Show<A> = Show.fromToString()): Kind<F, [void]> {
    return this.F.delay(() => {
      process.stdout.write(`${S.show(a)}\n`);
    });
  }

  public error<A>(a: A, S: Show<A> = Show.fromToString()): Kind<F, [void]> {
    return this.F.delay(() => {
      process.stderr.write(S.show(a));
    });
  }

  public errorLn<A>(a: A, S: Show<A> = Show.fromToString()): Kind<F, [void]> {
    return this.F.delay(() => {
      process.stderr.write(`${S.show(a)}\n`);
    });
  }
}

class TranslateConsole<F, G> extends Console<G> {
  public constructor(
    private readonly wrapped: Console<F>,
    private readonly nt: FunctionK<F, G>,
  ) {
    super();
  }

  public get readLine(): Kind<G, [string]> {
    return this.nt(this.wrapped.readLine);
  }

  public print<A>(a: A, S?: Show<A>): Kind<G, [void]> {
    return this.nt(this.wrapped.print(a, S));
  }

  public printLn<A>(a: A, S?: Show<A>): Kind<G, [void]> {
    return this.nt(this.wrapped.printLn(a, S));
  }

  public error<A>(a: A, S?: Show<A>): Kind<G, [void]> {
    return this.nt(this.wrapped.error(a, S));
  }

  public errorLn<A>(a: A, S?: Show<A>): Kind<G, [void]> {
    return this.nt(this.wrapped.errorLn(a, S));
  }
}
