// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

// Polyfill for drag event
Object.defineProperty(window, 'DragEvent', {
    value: class DragEvent {}
});
