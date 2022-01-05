// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, OrderedMap, Some } from '@fp4ts/cats';
import { PathComponent } from '../path-component';
import { TrieRouter } from '../trie-router';

describe('trie router', () => {
  it('should return none when empty', () => {
    expect(TrieRouter.empty.route_()).toEqual(None);
  });

  describe('constant routing', () => {
    it('should route a single constant path', () => {
      const t = TrieRouter.empty.register(PathComponent.from('x', 'y'), 42).get;

      expect(t.route('x', 'y')).toEqual(Some([42, OrderedMap.empty]));
    });

    it('should route one of two constant paths', () => {
      const t = TrieRouter.empty
        .register(PathComponent.from('x', 'y'), 42)
        .get.register(PathComponent.from('z', 'w'), 43).get;

      expect(t.route_('x', 'y')).toEqual(Some(42));
      expect(t.route_('z', 'w')).toEqual(Some(43));
    });

    it('should route one of two constant paths with overlapping prefix', () => {
      const t = TrieRouter.empty
        .register(PathComponent.from('x', 'y'), 42)
        .get.register(PathComponent.from('x', 'w'), 43).get;

      expect(t.route_('x', 'y')).toEqual(Some(42));
      expect(t.route_('x', 'w')).toEqual(Some(43));
    });

    it('should not match partially', () => {
      const t = TrieRouter.empty
        .register(PathComponent.from('x', 'y', 'z'), 42)
        .get.register(PathComponent.from('x', 'w'), 43).get;

      expect(t.route_('x', 'y')).toEqual(None);
      expect(t.route_('x')).toEqual(None);
      expect(t.route_('x', 'w', 'y')).toEqual(None);
    });
  });

  describe('parameter routing', () => {
    it('should match parameter component with any value', () => {
      const t = TrieRouter.empty.register(
        PathComponent.from('x', ':p'),
        42,
      ).get;

      expect(t.route_('x', 'y')).toEqual(Some(42));
      expect(t.route_('x', 'z')).toEqual(Some(42));
      expect(t.route_('x', 'W')).toEqual(Some(42));
    });

    it('should capture parameter value', () => {
      const t = TrieRouter.empty.register(
        PathComponent.from('x', ':p'),
        42,
      ).get;

      expect(t.route('x', 'y')).toEqual(Some([42, OrderedMap(['p', 'y'])]));
      expect(t.route('x', 'z')).toEqual(Some([42, OrderedMap(['p', 'z'])]));
      expect(t.route('x', 'W')).toEqual(Some([42, OrderedMap(['p', 'W'])]));
    });

    it('should not match when the path is partially matched', () => {
      const t = TrieRouter.empty.register(
        PathComponent.from('x', ':p'),
        42,
      ).get;

      expect(t.route('x')).toEqual(None);
      expect(t.route('x', 'y', 'z')).toEqual(None);
    });

    it('should prioritize constant matches over parameter ones', () => {
      const t = TrieRouter.empty
        .register(PathComponent.from('x', ':p'), 42)
        .get.register(PathComponent.from('x', 'y'), 43).get;

      expect(t.route('x', 'y')).toEqual(Some([43, OrderedMap.empty]));
      expect(t.route('x', 'z')).toEqual(Some([42, OrderedMap(['p', 'z'])]));
    });
  });
});
