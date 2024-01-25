// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { PandasModel } from '..';
import { createTestModel } from './utils';

describe('PandasModel', () => {
    it('should be createable', () => {
        expect(createTestModel(PandasModel)).toBeInstanceOf(PandasModel);
    });
});
