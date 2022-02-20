// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { ApiElement, ElementTag } from './api-element';

export const RecordTag = '@fp4ts/http/dsl-shared/record';
export type RecordTag = typeof RecordTag;

export class RecordElement<A extends {}> implements ApiElement<RecordTag> {
  public readonly [ElementTag] = RecordTag;
  public constructor(public readonly xs: A) {}
}

type NonEmptyRecord<A> = {} extends A ? never : A;
export const Record = <A extends {}>(xs: A): NonEmptyRecord<A> =>
  new RecordElement(xs) as any;
