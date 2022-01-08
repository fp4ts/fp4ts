import { MediaType } from '@fp4ts/http-core';

export interface ContentType {
  readonly mediaType: MediaType;
}

export const JSON = Object.freeze({
  tag: 'json',
  mediaType: MediaType.application_json,
});
export type JSON = typeof JSON;

export const PlainText = Object.freeze({
  tag: 'plain-text',
  mediaType: MediaType.text_plain,
});
export type PlainText = typeof PlainText;

export const NoContent = Object.freeze({
  tag: 'no-content',
});
export type NoContent = typeof NoContent;
