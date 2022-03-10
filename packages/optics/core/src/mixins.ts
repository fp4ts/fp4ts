// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Fold } from './fold';
import { Getter } from './getter';
import { applyMixins } from './internal/apply-mixin';
import { PLens } from './lens';
import { POptional } from './optional';
import { PPrism } from './prism';
import { PSetter } from './setter';
import { PTraversal } from './traversal';
import { PIso } from './iso';

applyMixins(Getter, Fold);

applyMixins(PTraversal, PSetter, Fold);

applyMixins(POptional, PTraversal);

applyMixins(PLens, POptional, Getter);

applyMixins(PLens, POptional);
applyMixins(PPrism, POptional);

applyMixins(PIso, PLens, PPrism);
