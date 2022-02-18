#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import pandas as pd

from ipywidgets import DOMWidget
from collections import defaultdict
from pandas.io.formats.style import Styler
from traitlets import Instance, Unicode, Integer
from IPython.core.getipython import get_ipython
from IPython.display import display

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

    # dataframe
    _df = Instance(pd.DataFrame)
    df = Instance(pd.DataFrame)

    # view
    view = Unicode('<div/>').tag(sync=True)

    # dimensions
    n_rows = Integer(0).tag(sync=True)
    n_cols = Integer(0).tag(sync=True)

    # ranges
    min_rows = Integer(0).tag(sync=True)
    max_rows = Integer(0).tag(sync=True)
    max_colwidth = Integer(0).tag(sync=True)
    win_sizefactor = Integer(0).tag(sync=True)

    # viewport
    start_rows = Integer(0).tag(sync=True)
    end_rows = Integer(0).tag(sync=True)

    # states
    state_rows = Unicode('{}').tag(sync=True)
    state_cols = Unicode('{}').tag(sync=True)

    def __init__(self, **kwargs):

        # register client events
        self.on_msg(self.message)

        # init defaults
        self.defaults(**kwargs)

        # init view
        self.update()

        # init widget
        super(PandasWidget, self).__init__(**kwargs)

    def defaults(self, **kwargs):

        # init original dataframe
        self.df = kwargs['df'] if 'df' in kwargs else pd.DataFrame()

        # init dimensions
        self.n_rows = self.df.shape[0]
        self.n_cols = self.df.shape[1]

        # init min rows
        if 'min_rows' not in kwargs:
            self.min_rows = pd.get_option('display.min_rows') or 10

        # init max rows
        if 'max_rows' not in kwargs:
            self.max_rows = pd.get_option('display.max_rows') or 0

        # init max column width
        if 'max_colwidth' not in kwargs:
            self.max_colwidth = pd.get_option('display.max_colwidth') or 0

        # init window size factor
        if 'win_sizefactor' not in kwargs:
            self.win_sizefactor = 10

        # init start rows
        if 'start_rows' not in kwargs:
            self.start_rows = 0

        # init end rows
        if 'end_rows' not in kwargs:
            if self.max_rows and self.n_rows > self.max_rows:
                self.end_rows = min(self.n_rows, self.min_rows // 2 + self.win_sizefactor * self.min_rows)
            else:
                self.end_rows = self.n_rows

        # init internal dataframe
        self._df = self.df.iloc[self.start_rows: self.end_rows].copy()

    def message(self, widget, content, buffers=None):
        model = content['model']

        # copy original dataframe (and use inplace operations afterwards)
        self._df = self.df.copy()

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

        # TODO filter logic
        for idx, col in model['state_cols'].items():
            pass

        # filter dataframe
        if filter_args:
            pass

    def sort(self, model):
        sort_args = defaultdict(list)

        for idx, col in model['state_cols'].items():
            sort = col['sort']
            if not sort:
                continue

            # sorting arguments
            sort_args['by'].append(self._df.iloc[:, int(idx)].name)
            sort_args['ascending'].append(sort == 'asc')

        # sort dataframe
        if sort_args:
            sort_args['inplace'] = True
            self._df.sort_values(**sort_args)

    def slice(self, model):
        slice_args = slice(model['start_rows'], model['end_rows'])

        # slice dataframe
        self._df = self._df.iloc[slice_args]

    def styles(self):
        """ TODO
          - custom styles support
          - check set_sticky
          - table title text
          - header histogram
        """
        styler = Styler(self._df, cell_ids=False, table_attributes='class="pd-table"')

        # table styles
        styler.set_table_styles(css_class_names={
            'level': 'pd-lvl-',
            'row': 'pd-row-',
            'col': 'pd-col-',
            'row_heading': 'pd-row-head',
            'col_heading': 'pd-col-head',
            'row_trim': 'pd-row-trim',
            'col_trim': 'pd-col-trim',
            'index_name': 'pd-index',
            'data': 'pd-data',
            'blank': 'pd-blank'
        })

        # column styles
        column_styles = {}
        for col in self._df.columns:
            iloc = self.df.columns.get_loc(col)
            column_styles[col] = [{'selector': 'th', 'props': [('--pd-df-iloc', iloc)]}]
        styler.set_table_styles(table_styles=column_styles, overwrite=False, axis=0)

        # row styles
        row_styles = {}
        for row in self._df.index:
            iloc = self.df.index.get_loc(row)
            row_styles[row] = [{'selector': 'th', 'props': [('--pd-df-iloc', iloc)]}]
        styler.set_table_styles(table_styles=row_styles, overwrite=False, axis=1)

        return styler

    def update(self):

        # update view html
        self.view = self.styles().to_html()

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
