import { Alt } from './alt';
import { Sub } from './sub';

// prettier-ignore
export type Endpoints<api> = 
   api extends Alt<infer a, infer b>
     ? AppendList<Endpoints<a>, Endpoints<b>>
  : api extends Sub<infer e, infer a>
    ? MapSub<e, Endpoints<a>>
  : [api];
export function Endpoints<api>(api: api): Endpoints<api>;
export function Endpoints(api: any): any {
  return api instanceof Alt
    ? AppendList(Endpoints(api.lhs), Endpoints(api.rhs))
    : api instanceof Sub
    ? MapSub(api.lhs, Endpoints(api.rhs))
    : [api];
}

// prettier-ignore
export type AppendList<xs extends unknown[], ys extends unknown[]> =
  xs extends [infer x, ...infer xs]
    ? [x, ...AppendList<xs, ys>]
    : ys;
export function AppendList<xs extends unknown[], ys extends unknown[]>(
  xs: xs,
  ys: ys,
): AppendList<xs, ys>;
export function AppendList(xs: any, ys: any): any {
  return xs.concat(ys);
}

// prettier-ignore
export type MapSub<e, xs extends unknown[]> =
  xs extends [infer x, ...infer xs]
    ? [Sub<e, x>, ...MapSub<e, xs>]
    : [];
export function MapSub<e, xs extends unknown[]>(e: e, xs: xs): MapSub<e, xs>;
export function MapSub(e: any, xs: any): any {
  return xs.length > 0 ? [e[':>'](xs[0]), ...MapSub(e, xs.slice(1))] : [];
}
