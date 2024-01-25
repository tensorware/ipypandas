#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.


def test_labextension_paths():

    # check that magic function can be imported from package root
    from ipypandas import _jupyter_labextension_paths

    # ensure that it can be called without incident
    path = _jupyter_labextension_paths()

    # some sanity checks
    assert len(path) == 1
    assert isinstance(path[0], dict)
