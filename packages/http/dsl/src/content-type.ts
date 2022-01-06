// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export const JSON = Object.freeze({ tag: 'JSON' as const });
export type JSON = typeof JSON;
export const PlainText = Object.freeze({ tag: 'PlainText' as const });
export type PlainText = typeof PlainText;
// export const FormUrlEncoded = Object.freeze({ tag: 'FormUrlEncoded' as const });
// export type FormUrlEncoded = typeof FormUrlEncoded;

export type ContentType = JSON | PlainText; // | FormUrlEncoded;
