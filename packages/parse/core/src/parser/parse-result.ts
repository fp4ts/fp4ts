// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { ParseError } from '../parse-error';
import { State } from './state';

export abstract class ParseResult<S, A> {
  public abstract fold<B, C = B>(
    onSuccess: (suc: Success<S, A>) => B,
    onFailure: (fail: Failure) => C,
  ): B | C;

  public abstract map<B>(f: (a: A) => B): ParseResult<S, B>;

  public abstract readonly toEither: Either<ParseError, A>;
}

export class Success<S, A> extends ParseResult<S, A> {
  public constructor(
    public readonly output: A,
    public readonly remainder: State<S>,
    public readonly error: ParseError,
  ) {
    super();
  }

  public get toEither(): Either<ParseError, A> {
    return Right(this.output);
  }

  public fold<B, C = B>(
    onSuccess: (suc: Success<S, A>) => B,
    onFailure: (fail: Failure) => C,
  ): B | C {
    return onSuccess(this);
  }

  public map<B>(f: (a: A) => B): Success<S, B> {
    return new Success(f(this.output), this.remainder, this.error);
  }

  public mergeError(error: ParseError): Success<S, A> {
    return new Success(this.output, this.remainder, error.merge(this.error));
  }

  public withError(error: ParseError): Success<S, A> {
    return new Success(this.output, this.remainder, error);
  }
}

export class Failure extends ParseResult<never, never> {
  public constructor(public readonly error: ParseError) {
    super();
  }

  public get toEither(): Either<ParseError, never> {
    return Left(this.error);
  }

  public fold<B, C = B>(
    onSuccess: (suc: Success<never, never>) => B,
    onFailure: (fail: Failure) => C,
  ): B | C {
    return onFailure(this);
  }

  public map<B>(f: (a: never) => B): ParseResult<never, B> {
    return this;
  }

  public mergeError(error: ParseError): Failure {
    return new Failure(error.merge(this.error));
  }

  public withError(error: ParseError): Failure {
    return new Failure(error);
  }
}
