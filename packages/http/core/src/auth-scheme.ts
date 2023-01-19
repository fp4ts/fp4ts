// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export type AuthScheme = string;
export const AuthScheme = Object.freeze({
  Basic: 'Basic' as const,
  Digest: 'Digest' as const,
  Bearer: 'Bearer' as const,
  OAuth: 'OAuth' as const,
});
