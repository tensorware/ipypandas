#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import pandas as pd

from uuid import uuid4
from collections import defaultdict

from IPython.display import display
from IPython.core.getipython import get_ipython

from ipywidgets import DOMWidget
from pandas.io.formats.style import Styler
from traitlets import Instance, Unicode, Integer

from ._version import module_name, module_version


class PandasWidget(DOMWidget):

    # module version
    _model_name = Unicode('PandasModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    # view version
    _view_name = Unicode('PandasView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    # dataframe, data json and view html
    df = Instance(pd.DataFrame)
    #_df = Instance(pd.DataFrame)
    data = Unicode('{}').tag(sync=True)
    view = Unicode('<br/>').tag(sync=True)

    # viewport
    top = Integer(0).tag(sync=True)
    height = Integer(0).tag(sync=True)
    size = Integer(0).tag(sync=True)

    # row and column actions
    row = Unicode('{}').tag(sync=True)
    col = Unicode('{}').tag(sync=True)

    def __init__(self, **kwargs):
        self.uuid = uuid4().hex[:5]

        # register client events
        self.on_msg(self.message)

        # init defaults
        self.defaults(**kwargs)

        # init representation
        self.update()

        # init widget
        super(PandasWidget, self).__init__(**kwargs)

    def defaults(self, **kwargs):

        # init internal dataframe
        if 'df' in kwargs:
            self._df = kwargs['df'].copy()  # TODO copy only viewport data
        else:
            self._df = pd.DataFrame()

        # init top
        if 'top' not in kwargs:
            self.top = 0

        # init height
        if 'height' not in kwargs:
            self.height = 50

        # init size
        self.size = self._df.shape[0]

    def message(self, widget, content, buffers=None):
        model = content['model']

        # copy original dataframe (do all operations inplace)
        self._df = self.df.copy()  # TODO copy only viewport data

        # filter dataframe
        self.filter(model)

        # sort dataframe
        self.sort(model)

        # slice dataframe
        self.slice(model)

        # update representation
        self.update()

    def filter(self, model):
        filter_args = defaultdict(list)

        for col in model['col'].values():
            pass  # TODO filter logic

        # filter dataframe
        if filter_args:
            pass  # TODO filter logic

    def sort(self, model):
        sort_args = defaultdict(list)

        for col in model['col'].values():
            idx = col['index']
            sort = col['sort']
            if not sort:
                continue

            # sorting arguments
            sort_args['by'].append(self._df.iloc[:, idx].name)
            sort_args['ascending'].append(sort == 'asc')

        # sort dataframe
        if sort_args:
            sort_args['inplace'] = True
            self._df.sort_values(**sort_args)

    def slice(self, model):
        start, end = self.top, self.height

        for col in model['col'].values():
            pass  # TODO slice viewport data

        # slice dataframe
        self._df = self._df.iloc[self.top: self.height]

    def update(self):

        # TODO filter viewport data

        # update data json
        self.data = self._df.to_json()

        # update view html
        view = Styler(self._df, uuid=self.uuid, cell_ids=True, table_attributes='class="pd-table"')
        self.view = view.set_table_styles(**self.styles()).to_html()

    def styles(self):
        css_class_names = {
            'level': 'pd-lvl-',
            'row': 'pd-row-',
            'col': 'pd-col-',
            'row_heading': 'pd-row-head',
            'col_heading': 'pd-col-head',
            'row_trim': 'pd-row-trim',
            'col_trim': 'pd-col-trim',
            'index_name': 'pd-idx',
            'data': 'pd-data',
            'blank': 'pd-blank'
        }
        table_styles_hover = [
            dict(selector='th.pd-row-head:hover', props=[('cursor', 'pointer')]),
            dict(selector='th.pd-col-head:hover', props=[('cursor', 'pointer')])
        ]
        return dict(css_class_names=css_class_names, table_styles=table_styles_hover)

    def __repr__(self):
        return self._df.__repr__()


def formatter():
    ipy = get_ipython()
    if ipy is None:
        return
    if ipy.display_formatter is None:
        return
    return ipy.display_formatter.ipython_display_formatter


def enable(**kwargs):
    ipy_fmt = formatter()
    ipy_fmt.for_type(pd.DataFrame, lambda df: display(PandasWidget(df=df, **kwargs)))


def disable():
    ipy_fmt = formatter()
    ipy_fmt.type_printers.pop(pd.DataFrame, None)
