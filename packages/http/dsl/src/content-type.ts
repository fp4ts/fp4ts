// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export declare const JSON: unique symbol;
export type JSON = typeof JSON;
export declare const PlainText: unique symbol;
export type PlainText = typeof PlainText;
export declare const FormUrlEncoded: unique symbol;
export type FormUrlEncoded = typeof FormUrlEncoded;

export type ContentType = JSON | PlainText | FormUrlEncoded;
