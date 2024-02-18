// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

// the base url for the notebook is not known at build time and is therefore computed dynamically
(window as any).__webpack_public_path__ = window.document.querySelector('body')!.getAttribute('data-base-url') + 'nbextensions/ipypandas';

export * from '../index';
