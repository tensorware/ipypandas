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
from traitlets import Unicode, Instance
from pandas.io.formats.style import Styler

from ._version import module_name, module_version


class PandasWidget(DOMWidget):
    _model_name = Unicode('PandasModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _view_name = Unicode('PandasView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    df = Instance(pd.DataFrame)

    data = Unicode('{}').tag(sync=True)
    view = Unicode('<div></div>').tag(sync=True)

    row = Unicode('{}').tag(sync=True)
    col = Unicode('{}').tag(sync=True)

    def __init__(self, *args, **kwargs):
        self.uuid = uuid4().hex[:5]
        if 'df' in kwargs:
            self._df = kwargs['df'].copy()
        else:
            self._df = pd.DataFrame()
        self.update()

        # kwargs are mapped to instance
        super(PandasWidget, self).__init__(*args, **kwargs)

        self.on_msg(self.handle_msg)

    def update(self):

        # update data json
        self.data = self._df.to_json()

        # update view html
        view = Styler(self._df, uuid=self.uuid, cell_ids=True, table_attributes='class="ipypandas"')
        view = view.set_table_styles(**self.styles())
        self.view = view.to_html()

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

    def handle_msg(self, widget, content, buffers=None):
        kwargs = defaultdict(list)

        df = self.df.copy()

        model = content['model']
        for col in model['col'].values():
            idx = col['index']
            sort = col['sort']

            # sorting
            if sort:
                kwargs['by'].append(df.iloc[:, idx].name)
                kwargs['ascending'].append(sort == 'asc')

        if kwargs:
            self._df = df.sort_values(**kwargs)
        else:
            self._df = df.copy()

        self.update()

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
    ipy_fmt.for_type(pd.DataFrame, lambda x: display(PandasWidget(df=x, **kwargs)))


def disable():
    ipy_fmt = formatter()
    ipy_fmt.type_printers.pop(pd.DataFrame, None)
