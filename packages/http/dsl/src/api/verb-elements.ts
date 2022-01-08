import { Schema } from '@fp4ts/schema';
import { ContentType } from './content-types';
import { ElementBase } from './element-base';

export class VerbElement<
  M,
  S extends number,
  Cts extends ContentType[],
  A,
> extends ElementBase {
  private readonly __void!: void;
  public constructor(
    public readonly method: M,
    public readonly status: S,
    public readonly contentTypes: Cts,
    public readonly a: A,
  ) {
    super();
  }
}

export class NoContentVerbElement<M extends string> extends ElementBase {
  private readonly __void!: void;
  public constructor(public readonly method: M) {
    super();
  }
}

export const Verb = <M, S extends number>(method: M, status: S) => {
  function curried<Cts extends ContentType[], A>(
    cts: Cts,
    a: Schema<A>,
  ): VerbElement<M, S, Cts, A>;
  function curried<Cts extends ContentType[], A>(
    cts: Cts,
    a: A,
  ): VerbElement<M, S, Cts, A>;
  function curried(cts: any, a: any): any {
    return new VerbElement(method, status, cts, a);
  }

  return curried;
};

export const NoContentVerb = <M extends string>(
  method: M,
): NoContentVerbElement<M> => new NoContentVerbElement(method);

export const Get = Verb('GET', 200);
export const Post = Verb('POST', 200);
export const Put = Verb('PUT', 200);
export const Delete = Verb('DELETE', 200);

export const PostCreated = Verb('POST', 201);
export const PutCreated = Verb('PUT', 201);

export const GetNoContent = NoContentVerb('GET');
export const PostNoContent = NoContentVerb('POST');
export const PutNoContent = NoContentVerb('PUT');
export const DeleteNoContent = NoContentVerb('DELETE');
export const PatchNoContent = NoContentVerb('PATCH');
export const HeadNoContent = NoContentVerb('HEAD');
