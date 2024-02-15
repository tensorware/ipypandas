// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

(window as any).__webpack_public_path__ = document.querySelector('body')!.getAttribute('data-base-url') + 'nbextensions/ipypandas';

export * from './version';
export * from './widget';
