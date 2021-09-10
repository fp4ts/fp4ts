import { Auto, Kind, Fix, URIS } from '../../core';
import { Sync } from './sync';

export class Ref<F extends URIS, A, C = Auto> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(private readonly F: Sync<F, C>, private value: A) {}

  public readonly get: <S, R>() => Kind<F, C, S, R, Error, A> = () =>
    this.F.delay(() => this.value);

  public readonly set: <S, R>(a: A) => Kind<F, C, S, R, Error, void> = x =>
    this.F.delay(() => {
      this.value = x;
    });

  public readonly update: <S, R>(
    f: (a: A) => A,
  ) => Kind<F, C, S, R, Error, void> = f =>
    this.F.delay(() => {
      this.value = f(this.value);
    });

  public readonly updateAndGet: <S, R>(
    f: (a: A) => A,
  ) => Kind<F, C, S, R, Error, A> = f =>
    this.F.delay(() => (this.value = f(this.value)));

  public readonly modify: <S, R, B>(
    f: (a: A) => [A, B],
  ) => Kind<F, C, S, R, Error, B> = f =>
    this.F.delay(() => {
      const [x, r] = f(this.value);
      this.value = x;
      return r;
    });

  public static readonly of =
    <F extends URIS, C = Auto>(F: Sync<F, C>) =>
    <S, R, B>(
      x: B,
    ): Kind<F, C, S, R, Error, Ref<F, B, C & Fix<'S', S> & Fix<'R', R>>> =>
      F.delay(() => new Ref(F, x));
}

// Point-free

export const of: <F extends URIS, C = Auto>(
  F: Sync<F, C>,
) => <S, R, A>(
  a: A,
) => Kind<F, C, S, R, Error, Ref<F, A, C & Fix<'S', S> & Fix<'R', R>>> = F =>
  Ref.of(F);

export const get: <F extends URIS, C, S, R, A>(
  ra: Ref<F, A, C>,
) => Kind<F, C, S, R, Error, A> = ra => ra.get();

export const set: <A>(
  a: A,
) => <F extends URIS, C, S, R>(
  ra: Ref<F, A, C>,
) => Kind<F, C, S, R, Error, void> = a => ra => set_(ra, a);

export const update: <A>(
  f: (a: A) => A,
) => <F extends URIS, C, S, R>(
  ra: Ref<F, A, C>,
) => Kind<F, C, S, R, Error, void> = f => ra => update_(ra, f);

export const updateAndGet: <A>(
  f: (a: A) => A,
) => <F extends URIS, C, S, R>(
  ref: Ref<F, A, C>,
) => Kind<F, C, S, R, Error, A> = f => ra => updateAndGet_(ra, f);

export const modify: <A, B>(
  f: (a: A) => [A, B],
) => <F extends URIS, C, S, R>(ra: Ref<F, A, C>) => Kind<F, C, S, R, Error, B> =
  f => ra => modify_(ra, f);

// Point-ful

export const set_: <F extends URIS, C, S, R, A>(
  ra: Ref<F, A, C>,
  a: A,
) => Kind<F, C, S, R, Error, void> = (ra, a) => ra.set(a);
export const update_: <F extends URIS, C, S, R, A>(
  ra: Ref<F, A, C>,
  f: (a: A) => A,
) => Kind<F, C, S, R, Error, void> = (ra, f) => ra.update(f);
export const updateAndGet_: <F extends URIS, C, S, R, A>(
  ra: Ref<F, A, C>,
  f: (a: A) => A,
) => Kind<F, C, S, R, Error, A> = (ra, f) => ra.updateAndGet(f);
export const modify_: <F extends URIS, C, S, R, A, B>(
  ra: Ref<F, A, C>,
  f: (a: A) => [A, B],
) => Kind<F, C, S, R, Error, B> = (ra, f) => ra.modify(f);
