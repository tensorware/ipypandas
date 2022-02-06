// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { PandasView } from '..';

describe('PandasView', () => {
    it('should not be createable', () => {
        expect(() => { new PandasView() }).toThrow(TypeError);
    });
});
