import { Auto, Base, Empty, Kind, URIS } from '../../core';
import { FunctionK, Show } from '../../cats';

export interface Console<F extends URIS, C = Auto> extends Base<F, C> {
  readonly readLine: Kind<
    F,
    C,
    Empty<C, 'S'>,
    Empty<C, 'R'>,
    Empty<C, 'E'>,
    string
  >;

  print<A>(a: A): string;
  print<A>(S: Show<A>, a: A): string;

  printLn<A>(a: A): string;
  printLn<A>(S: Show<A>, a: A): string;

  error<A>(a: A): string;
  error<A>(S: Show<A>, a: A): string;

  errorLn<A>(a: A): string;
  errorLn<A>(S: Show<A>, a: A): string;

  mapK<G extends URIS, CG>(nt: FunctionK<F, G, C, CG>): Console<G, CG>;
}
