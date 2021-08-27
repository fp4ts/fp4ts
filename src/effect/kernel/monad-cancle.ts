import { MonadError } from '../../cats';
import { Kind } from '../../fp/hkt';
import { Poll } from './poll';

export interface MonadCancel<F, E> extends MonadError<F, E> {
  readonly uncancelable: <A>(body: (poll: Poll<F>) => Kind<F, A>) => Kind<F, A>;
  readonly onCancel: <A>(fa: Kind<F, A>, fin: Kind<F, void>) => Kind<F, A>;
}
