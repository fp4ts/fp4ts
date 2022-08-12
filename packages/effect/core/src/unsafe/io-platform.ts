// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const PlatformConfig = Object.freeze({
  AUTO_SUSPEND_THRESHOLD: parseInt(
    process.env.FP4TS_EFFECT_IO_AUTO_SUSPEND_THRESHOLD ?? '512',
    10,
  ),
  TRACE_MODE:
    process.env.FP4TS_TRACING_MODE ??
    (process.env.NODE_ENV === 'production' ? 'off' : 'full'),
  TRACE_BUFFER_SIZE: parseInt(process.env.FP4TS_TRACE_BUFFER_SIZE ?? '16', 10),
});
