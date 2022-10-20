// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const MapK = 0;
export const FlatMapK = 1;
export const HandleErrorWithK = 2;
export const AttemptK = 3;
export const OnCancelK = 4;
export const UncancelableK = 5;
export const UnmaskK = 6;
export const RunOnK = 7;
export const CancelationLoopK = 8;
export const TerminateK = 9;
export type Continuation =
  | typeof MapK
  | typeof FlatMapK
  | typeof HandleErrorWithK
  | typeof AttemptK
  | typeof OnCancelK
  | typeof UncancelableK
  | typeof UnmaskK
  | typeof RunOnK
  | typeof CancelationLoopK
  | typeof TerminateK;

export const ExecR = 0;
export const AsyncContinueSuccessfulR = 1;
export const AsyncContinueFailedR = 2;
export const AsyncContinueCanceledR = 3;
export const AsyncContinueCanceledWithFinalizerR = 4;
export const SuspendR = 5;
export const AutoSuspendR = 6;
export const DoneR = 7;
export type ResumeTag =
  | typeof ExecR
  | typeof AsyncContinueSuccessfulR
  | typeof AsyncContinueFailedR
  | typeof AsyncContinueCanceledR
  | typeof AsyncContinueCanceledWithFinalizerR
  | typeof SuspendR
  | typeof AutoSuspendR
  | typeof DoneR;

export const MaxStackSize = 512;
