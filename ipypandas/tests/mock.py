#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import pytest

from ipykernel.comm import Comm
from ipywidgets import Widget


undefined = object()
_widget_attrs = {}


class MockComm(Comm):
    kernel = 'Truthy'
    comm_id = 'a-b-c-d'

    def __init__(self, *args, **kwargs):
        self.log_open = []
        self.log_send = []
        self.log_close = []
        super(MockComm, self).__init__(*args, **kwargs)

    def open(self, *args, **kwargs):
        self.log_open.append((args, kwargs))

    def send(self, *args, **kwargs):
        self.log_send.append((args, kwargs))

    def close(self, *args, **kwargs):
        self.log_close.append((args, kwargs))


@pytest.fixture
def mock_comm():
    _widget_attrs['_ipython_display_'] = Widget._ipython_display_
    def raise_not_implemented(*args, **kwargs):
        raise NotImplementedError()
    Widget._ipython_display_ = raise_not_implemented

    _widget_attrs['_comm_default'] = getattr(Widget, '_comm_default', undefined)
    Widget._comm_default = lambda self: MockComm()

    yield MockComm()

    for attr, value in _widget_attrs.items():
        if value is undefined:
            delattr(Widget, attr)
        else:
            setattr(Widget, attr, value)
