import { AnyK, Kind } from '../../../core';
import { Outcome, view } from './algebra';

export const fold: <F extends AnyK, E, A, B>(
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, [A]>) => B,
) => (oc: Outcome<F, E, A>) => B = (onCancel, onFailure, onSuccess) => oc =>
  fold_(oc, onCancel, onFailure, onSuccess);

export const fold_ = <F extends AnyK, E, A, B>(
  _oc: Outcome<F, E, A>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, [A]>) => B,
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
