import { Auto, Base, Kind, Kind1 } from '../../core';
import { FunctionK, Show } from '../../cats';

export interface Console<F, C = Auto> extends Base<F, C> {
  readonly readLine: Kind1<F, C, string>;

  print<A>(a: A): string;
  print<A>(S: Show<A>, a: A): string;

  printLn<A>(a: A): string;
  printLn<A>(S: Show<A>, a: A): string;

  error<A>(a: A): string;
  error<A>(S: Show<A>, a: A): string;

  errorLn<A>(a: A): string;
  errorLn<A>(S: Show<A>, a: A): string;

  mapK<G, CG>(nt: FunctionK<F, G, C, CG>): Console<G, CG>;
}
