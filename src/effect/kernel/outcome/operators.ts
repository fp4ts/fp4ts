import { Kind, URIS } from '../../../core';
import { Outcome, view } from './algebra';

export const fold: <F extends URIS, C2, S2, R2, E2, E, A, B>(
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, C2, S2, R2, E2, A>) => B,
) => (oc: Outcome<F, E, A, C2>) => B = (onCancel, onFailure, onSuccess) => oc =>
  fold_(oc, onCancel, onFailure, onSuccess);

export const fold_ = <F extends URIS, C2, S2, R2, E2, E, A, B>(
  _oc: Outcome<F, E, A, C2>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, C2, S2, R2, E2, A>) => B,
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
