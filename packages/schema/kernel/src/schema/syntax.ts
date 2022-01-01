import { Schema } from './algebra';
import { intersection_, nullable, union_ } from './operators';

declare module './algebra' {
  interface Schema<A> {
    readonly nullable: Schema<A | null>;

    union<B>(that: Schema<B>): Schema<A | B>;
    '<|>'<B>(that: Schema<B>): Schema<A | B>;

    intersection<B>(that: Schema<B>): Schema<A & B>;
    '<&>'<B>(that: Schema<B>): Schema<A & B>;
  }
}

Object.defineProperty(Schema.prototype, 'nullable', {
  get<A>(this: Schema<A>): Schema<A | null> {
    return nullable(this);
  },
});

Schema.prototype.union = function (that) {
  return union_(this, that);
};
Schema.prototype['<|>'] = Schema.prototype.union;

Schema.prototype.intersection = function (that) {
  return intersection_(this, that);
};
Schema.prototype['<&>'] = Schema.prototype.intersection;
