#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import pandas as pd

from ..widget import PandasWidget


def test_widget():

    # init widget without parameters
    w = PandasWidget()

    # empty panda dataframe should be used
    assert isinstance(w._df, pd.DataFrame)
