import { FunctionK, Show } from '../../cats';
import { Kind } from '../../fp/hkt';

export interface Console<F> {
  readonly readLine: Kind<F, string>;

  print<A>(a: A): string;
  print<A>(S: Show<A>, a: A): string;

  printLn<A>(a: A): string;
  printLn<A>(S: Show<A>, a: A): string;

  error<A>(a: A): string;
  error<A>(S: Show<A>, a: A): string;

  errorLn<A>(a: A): string;
  errorLn<A>(S: Show<A>, a: A): string;

  mapK<G>(nt: FunctionK<F, G>): Console<G>;
}
