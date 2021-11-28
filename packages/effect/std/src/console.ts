// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Kind } from '@fp4ts/core';
import { FunctionK, Show } from '@fp4ts/cats-core';

export interface Console<F> extends Base<F> {
  readonly readLine: Kind<F, [string]>;

  print<A>(a: A): Kind<F, [void]>;
  print<A>(S: Show<A>, a: A): Kind<F, [void]>;

  printLn<A>(a: A): Kind<F, [void]>;
  printLn<A>(S: Show<A>, a: A): Kind<F, [void]>;

  error<A>(a: A): Kind<F, [void]>;
  error<A>(S: Show<A>, a: A): Kind<F, [void]>;

  errorLn<A>(a: A): Kind<F, [void]>;
  errorLn<A>(S: Show<A>, a: A): Kind<F, [void]>;

  mapK<G>(nt: FunctionK<F, G>): Console<G>;
}
