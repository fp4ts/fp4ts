// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { iplens, iso } from '@fp4ts/optics-core';

export const _year = iplens<Date, number>(
  d => d.getFullYear(),
  d => v => new Date(new Date(d).setFullYear(v)),
);

export const _month = iplens<Date, number>(
  d => d.getMonth(),
  d => v => new Date(new Date(d).setMonth(v)),
);

export const _day = iplens<Date, number>(
  d => d.getDate(),
  d => v => new Date(new Date(d).setDate(v)),
);

export const _hour = iplens<Date, number>(
  d => d.getHours(),
  d => v => new Date(new Date(d).setHours(v)),
);

export const _minute = iplens<Date, number>(
  d => d.getMinutes(),
  d => v => new Date(new Date(d).setMinutes(v)),
);

export const _second = iplens<Date, number>(
  d => d.getSeconds(),
  d => v => new Date(new Date(d).setSeconds(v)),
);

export const _millisecond = iplens<Date, number>(
  d => d.getMilliseconds(),
  d => v => new Date(new Date(d).setMilliseconds(v)),
);

export const _milliseconds = iso<Date, number>(
  d => d.valueOf(),
  n => new Date(n),
);
