import { Kind1, URIS } from '../../../core';
import { Outcome, view } from './algebra';

export const fold: <F extends URIS, C2, E, A, B>(
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind1<F, C2, A>) => B,
) => (oc: Outcome<F, E, A>) => B = (onCancel, onFailure, onSuccess) => oc =>
  fold_(oc, onCancel, onFailure, onSuccess);

export const fold_ = <F extends URIS, C2, E, A, B>(
  _oc: Outcome<F, E, A>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind1<F, C2, A>) => B,
): B => {
  const oc = view(_oc);
  switch (oc.tag) {
    case 'success':
      return onSuccess(oc.result);
    case 'failure':
      return onFailure(oc.error);
    case 'canceled':
      return onCancel();
  }
};
