// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

define(() => {
    "use strict";

    window['requirejs'].config({
        map: {
            '*': {
                'ipypandas': 'nbextensions/ipypandas/index',
            },
        }
    });

    return { load_ipython_extension: () => { } };
});