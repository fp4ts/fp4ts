import { IO } from './io';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Ref<A> {
  // @ts-ignore
  private readonly __void: void;

  private constructor(private value: A) {}

  public readonly get: () => IO<A> = () => IO(() => this.value);

  public readonly set: (a: A) => IO<void> = x =>
    IO(() => {
      this.value = x;
    });

  public readonly update: (f: (a: A) => A) => IO<void> = f =>
    IO(() => {
      this.value = f(this.value);
    });

  public readonly updateAndGet: (f: (a: A) => A) => IO<A> = f =>
    IO(() => (this.value = f(this.value)));

  public readonly modify: <B>(f: (a: A) => [A, B]) => IO<B> = f =>
    IO(() => {
      const [x, r] = f(this.value);
      this.value = x;
      return r;
    });

  public static readonly of = <B>(x: B): IO<Ref<B>> => IO(() => new Ref(x));
}

// Point-free

export const of: <A>(a: A) => IO<Ref<A>> = a => Ref.of(a);

export const get: <A>(ra: Ref<A>) => IO<A> = ra => ra.get();

export const set: <A>(a: A) => (ra: Ref<A>) => IO<void> = a => ra =>
  set_(ra, a);

export const update: <A>(f: (a: A) => A) => (ra: Ref<A>) => IO<void> =
  f => ra =>
    update_(ra, f);
export const updateAndGet: <A>(f: (a: A) => A) => (ref: Ref<A>) => IO<A> =
  f => ra =>
    updateAndGet_(ra, f);
export const modify: <A, B>(f: (a: A) => [A, B]) => (ra: Ref<A>) => IO<B> =
  f => ra =>
    modify_(ra, f);

// Point-ful

export const set_: <A>(ra: Ref<A>, a: A) => IO<void> = (ra, a) => ra.set(a);
export const update_: <A>(ra: Ref<A>, f: (a: A) => A) => IO<void> = (ra, f) =>
  ra.update(f);
export const updateAndGet_: <A>(ra: Ref<A>, f: (a: A) => A) => IO<A> = (
  ra,
  f,
) => ra.updateAndGet(f);
export const modify_: <A, B>(ra: Ref<A>, f: (a: A) => [A, B]) => IO<B> = (
  ra,
  f,
) => ra.modify(f);
