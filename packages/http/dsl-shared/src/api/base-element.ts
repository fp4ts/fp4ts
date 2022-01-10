import { ApiElement, ElementTag } from './api-element';

export abstract class BaseElement<T extends string> implements ApiElement<T> {
  abstract readonly [ElementTag]: T;
}
