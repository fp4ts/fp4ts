// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const PlatformConfig = Object.freeze({
  AUTO_SUSPEND_THRESHOLD: parseInt(
    process.env.EFFECT_IO_AUTO_SUSPEND_THRESHOLD ?? '512',
    10,
  ),
});
