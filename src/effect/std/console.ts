import { AnyK, Base, Kind } from '../../core';
import { FunctionK, Show } from '../../cats';

export interface Console<F extends AnyK> extends Base<F> {
  readonly readLine: Kind<F, [string]>;

  print<A>(a: A): Kind<F, [void]>;
  print<A>(S: Show<A>, a: A): Kind<F, [void]>;

  printLn<A>(a: A): Kind<F, [void]>;
  printLn<A>(S: Show<A>, a: A): Kind<F, [void]>;

  error<A>(a: A): Kind<F, [void]>;
  error<A>(S: Show<A>, a: A): Kind<F, [void]>;

  errorLn<A>(a: A): Kind<F, [void]>;
  errorLn<A>(S: Show<A>, a: A): Kind<F, [void]>;

  mapK<G extends AnyK>(nt: FunctionK<F, G>): Console<G>;
}
