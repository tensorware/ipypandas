#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import json
import pandas as pd

from datetime import datetime
from collections import defaultdict
from pandas.io.formats.style import Styler

from ipywidgets import DOMWidget, register
from traitlets import Instance, Unicode, Integer, observe

from IPython.display import display
from IPython.core.getipython import get_ipython

from ._version import module_name, module_version


@register
class PandasWidget(DOMWidget):

    # module version of pandas widget
    _model_name = Unicode('PandasModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    # view version of pandas widget
    _view_name = Unicode('PandasView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    # sync flags between client and server
    upsync = Unicode('').tag(sync=True)
    downsync = Unicode('').tag(sync=True)

    # dataframe
    df = Instance(pd.DataFrame)
    df_copy = Instance(pd.DataFrame)

    # layout
    styler = Instance(Styler)
    view = Unicode('<div/>').tag(sync=True)

    # options
    min_rows = Integer(0).tag(sync=True)
    max_rows = Integer(0).tag(sync=True)
    max_colwidth = Integer(0).tag(sync=True)
    precision = Integer(0).tag(sync=True)

    # viewport
    n_rows = Integer(0).tag(sync=True)
    n_cols = Integer(0).tag(sync=True)
    start_row = Integer(0).tag(sync=True)
    end_row = Integer(0).tag(sync=True)

    # states
    state_rows = Unicode('{}').tag(sync=True)
    state_cols = Unicode('{}').tag(sync=True)
    search_query = Unicode('').tag(sync=True)

    def __init__(self, **kwargs):

        # init from dataframe or styler
        if 'df' in kwargs:
            self.df = kwargs['df']
            self.styler = Styler(self.df)
        elif 'styler' in kwargs:
            self.df = kwargs['styler'].data
            self.styler = kwargs['styler']
        else:
            self.df = pd.DataFrame()
            self.styler = Styler(self.df)

        # init min rows
        if 'min_rows' not in kwargs:
            self.min_rows = pd.get_option('display.min_rows') or 10

        # init max rows
        if 'max_rows' not in kwargs:
            self.max_rows = pd.get_option('display.max_rows') or 0

        # init max column width
        if 'max_colwidth' not in kwargs:
            self.max_colwidth = pd.get_option('display.max_colwidth') or 0

        # init float precision
        if 'precision' not in kwargs:
            self.precision = pd.get_option('display.precision') or 6

        # init dimensions
        self.n_rows = self.df.shape[0]
        self.n_cols = self.df.shape[1]

        # init viewport
        self.start_row = 0
        if self.max_rows and self.n_rows > self.max_rows:
            self.end_row = min(self.n_rows, 1000)
        else:
            self.end_row = self.n_rows

        # init internal dataframe
        self.df_copy = self.df.copy()

        # init view by simulated client update
        self.downsync = f'init-{datetime.utcnow().timestamp() * 1000:.0f}'

        # init pandas widget
        super(PandasWidget, self).__init__(**kwargs)

    @observe('downsync')
    def update(self, change):

        # copy original dataframe
        self.df_copy = self.df.copy()

        # update dataframe
        self.search()
        self.filter()
        self.sort()

        # reset viewport on dimensions change
        viewport_changed = self.n_rows != self.df_copy.shape[0] or self.n_cols != self.df_copy.shape[1]
        if viewport_changed:
            self.n_rows = self.df_copy.shape[0]
            self.n_cols = self.df_copy.shape[1]
            self.upsync = f'reset-{datetime.utcnow().timestamp() * 1000:.0f}'
            return

        # update view representation
        self.view = self.styles().to_html()

    def search(self):
        search_args = self.search_query.split('&')
        if len(search_args) == 0:
            return

        # convert to string columns
        df_str = self.df_copy.astype(str, errors='ignore').select_dtypes(include=['object', 'string'])
        if df_str.shape[0] == 0 or df_str.shape[1] == 0:
            self.df_copy = self.df_copy.head(0)
            return

        # search dataframe by string contains
        query_args = dict(na=False, case=False, regex=True)
        for query in search_args:
            mask = df_str.apply(lambda row: row.str.contains(query.strip(), **query_args)).any(axis=1)
            self.df_copy = self.df_copy.loc[mask]
            df_str = df_str.loc[mask]

    def filter(self):
        state_cols = json.loads(self.state_cols)
        if 'filter' not in state_cols:
            return

        # TODO: generate filter arguments
        filter_args = defaultdict(list)
        for idx, col in state_cols['filter'].items():
            pass

        # filter dataframe
        if filter_args:
            pass

    def sort(self):
        state_cols = json.loads(self.state_cols)
        if 'sort' not in state_cols:
            return

        # generate sort arguments
        sort_args = defaultdict(list)
        for idx, value in state_cols['sort'].items():
            sort_args['by'].append(self.df_copy.iloc[:, int(idx[5:])].name)
            sort_args['ascending'].append(value == 'asc')

        # sort dataframe
        if sort_args:
            sort_args['inplace'] = True
            self.df_copy.sort_values(**sort_args)

    def styles(self):

        # use sliced dataframe
        self.styler.data = self.df_copy.iloc[self.start_row:self.end_row]

        # use columns by sort order
        state_cols = json.loads(self.state_cols)
        if 'order' in state_cols:
            columns = [self.df_copy.iloc[:, int(idx[5:])].name for idx in state_cols['order']]
            self.styler.data = self.styler.data.reindex(columns, axis='columns')

        # table styles
        self.styler.table_attributes = 'class="pd-table"'
        self.styler.set_table_styles(css_class_names={
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
        for col in self.styler.data.columns:
            iloc = self.df_copy.columns.get_loc(col)
            column_styles[col] = [{'selector': 'th', 'props': [('--pd-df-iloc', f'iloc-{iloc}')]}]
        self.styler.set_table_styles(table_styles=column_styles, overwrite=False, axis=0)

        draggable = str(not isinstance(self.df_copy.columns, pd.MultiIndex)).lower()
        col_text = f'<span class="pd-col-text" draggable="{draggable}">{{0}}</span>'
        col_rescale_icon = '<span class="pd-col-i-rescale"></span>'
        col_filter_icon = '<span class="pd-col-i-filter"></span>'
        col_sort_icon = '<span class="pd-col-i-sort"></span>'
        self.styler.format_index(lambda x: f'{col_rescale_icon}{col_sort_icon}{col_text}{col_filter_icon}'.format(x), axis=1)

        # row styles
        row_styles = {}
        for row in self.styler.data.index:
            iloc = self.df_copy.index.get_loc(row)
            row_styles[row] = [{'selector': 'th', 'props': [('--pd-df-iloc', f'iloc-{iloc}')]}]
        self.styler.set_table_styles(table_styles=row_styles, overwrite=False, axis=1)

        row_text = '<span class="pd-row-text">{0}</span>'
        self.styler.format_index(lambda x: f'{row_text}'.format(x), axis=0)

        # content styles
        self.styler.format(precision=self.precision)

        # disable cell ids
        self.styler.cell_ids = False

        return self.styler

    def __repr__(self):
        rows, cols = self.df_copy.shape
        return f'{type(self)}, {rows} rows × {cols} columns'


def formatter():
    ipy = get_ipython()
    if ipy is None or ipy.display_formatter is None:
        return None
    return ipy.display_formatter.ipython_display_formatter


def enable(**kwargs):
    ipy_fmt = formatter()
    if ipy_fmt is None:
        return
    ipy_fmt.for_type(pd.DataFrame, lambda df: display(PandasWidget(df=df, **kwargs)))
    ipy_fmt.for_type(Styler, lambda styler: display(PandasWidget(styler=styler, **kwargs)))


def disable():
    ipy_fmt = formatter()
    if ipy_fmt is None:
        return
    ipy_fmt.type_printers.pop(pd.DataFrame, None)
    ipy_fmt.type_printers.pop(Styler, None)
