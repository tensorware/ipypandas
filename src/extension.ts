// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

(window as any).__webpack_public_path__ = document.querySelector('body')?.getAttribute('data-base-url') + 'nbextensions/ipypandas';

export * from './index';
