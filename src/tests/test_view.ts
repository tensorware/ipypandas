// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { PandasView } from '..';
import { createTestView } from './mock';

describe('PandasView', () => {
    it('should not be createable', () => {
        expect(() => {
            createTestView(PandasView);
        }).toThrow(TypeError);
    });
});
