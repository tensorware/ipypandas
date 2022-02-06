// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { PandasModel } from '..';
import { createTestModel } from './utils';

describe('PandasModel', () => {
    it('should be createable', () => {
        const model = createTestModel(PandasModel);
        expect(model).toBeInstanceOf(PandasModel);
    });
});
