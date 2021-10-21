import { Option } from '../option';
import { Seq } from './seq';

export interface IndexedSeq<A> extends Seq<A> {
  elem(idx: number): A;
  '!!'(idx: number): A;

  elemOption(idx: number): Option<A>;
  '!?'(idx: number): Option<A>;
}
