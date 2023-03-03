// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option, Some } from '@fp4ts/cats';
import { Prism, preview, review } from '@fp4ts/optics-core';
import { MonadReader } from '@fp4ts/mtl-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { TraversalLaws } from './traversal-laws';

export const PrismLaws = <S, A>(prism: Prism<S, A>) => ({
  ...TraversalLaws(prism),

  previewReviewIsSome: (a: A): IsEq<Option<A>> =>
    new IsEq(
      preview(MonadReader.Function1<S>())(prism)(
        review(MonadReader.Function1<A>())(prism)(a),
      ),
      Some(a),
    ),

  reviewPreviewIsIdentity: (s: S): IsEq<S> =>
    new IsEq(
      preview(MonadReader.Function1<S>())(prism)(s).fold(
        () => s,
        review(MonadReader.Function1<A>())(prism),
      ),
      s,
    ),
});
