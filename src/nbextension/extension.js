// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

// entry point for the notebook bundle containing custom model definitions
define(function () {
    'use strict';
    window['requirejs'].config({ map: { '*': { ipypandas: 'nbextensions/ipypandas/index' } } });

    // export the required load_ipython_extension function
    return {
        load_ipython_extension: function () {}
    };
});
