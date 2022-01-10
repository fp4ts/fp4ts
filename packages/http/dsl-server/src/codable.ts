import { Either } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http-core';

export interface Codable<A> {
  encode: (a: A) => string;
  decode: (a: string) => Either<MessageFailure, A>;
}
