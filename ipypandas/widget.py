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

from .version import module_version, module_name, module_log


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
    logger = Unicode('{}').tag(sync=True)

    # dataframe
    df = Instance(pd.DataFrame)
    df_copy = Instance(pd.DataFrame)

    # styles
    styler = Instance(Styler)
    styler_copy = Instance(Styler)

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
    view = Unicode('<div/>').tag(sync=True)

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
        self.end_row = min(self.n_rows, 1000) if self.max_rows and self.n_rows > self.max_rows else self.n_rows

        # init internal data
        self.df_copy = self.df.copy()
        self.styler_copy = self.styler._copy(True)

        # init view by simulated client update
        self.downsync = f'init-{datetime.now().timestamp() * 1000:.0f}'

        # init pandas widget
        super(PandasWidget, self).__init__(**kwargs)

    @observe('downsync')
    def update(self, change):
        self.log('info', 'update widget')

        # copy original data
        self.df_copy = self.df.copy()
        self.styler_copy = self.styler._copy(True)

        # reset viewport dimensions
        if self.df_copy.shape != (self.n_rows, self.n_cols):
            self.n_rows, self.n_cols = self.df_copy.shape
            self.upsync = f'reset-{datetime.now().timestamp() * 1000:.0f}'
            return

        # update data
        self.filter()
        self.search()
        self.sort()
        self.order()

        # update viewport data
        self.n_rows, self.n_cols = self.df_copy.shape
        self.df_copy = self.df_copy.iloc[self.start_row:self.end_row]

        # update viewport representation
        self.styler_copy.data = self.df_copy
        self.styler_copy.index = self.df_copy.index
        self.styler_copy.columns = self.df_copy.columns
        self.view = self.styles().to_html()

    def filter(self):

        # drop hidden rows
        index = [self.df.iloc[iloc,:].name for iloc in self.styler_copy.hidden_rows]
        self.df_copy.drop(index=index, inplace=True)
        self.styler_copy.hidden_rows = []

        # use filtered rows
        state_cols = json.loads(self.state_cols)
        if 'filter' not in state_cols:
            return

        # TODO: generate filter arguments

    def search(self):

        # build search query
        search_args = self.search_query.split('&')
        if len(search_args) == 0 or len(search_args[0]) == 0:
            return

        # convert to string columns
        df_str = self.df_copy.astype(str, errors='ignore').select_dtypes(include=['object', 'string'])
        if df_str.shape[0] == 0 or df_str.shape[1] == 0:
            self.df_copy = self.df_copy.head(0)
            return

        # search data by string contains
        query_args = dict(na=False, case=False, regex=True)
        for query in search_args:
            self.log('info', f'search query = {query}')
            mask = df_str.apply(lambda row: row.str.contains(query.strip(), **query_args)).any(axis=1)
            self.df_copy = self.df_copy.loc[mask]
            df_str = df_str.loc[mask]

    def sort(self):

        # use sorted rows
        state_cols = json.loads(self.state_cols)
        if 'sort' not in state_cols:
            return

        # generate sort arguments
        sort_args = defaultdict(list)
        for idx, value in state_cols['sort'].items():
            column = self.df_copy.iloc[:,int(idx[5:])].name
            sort_args['by'].append(column)
            sort_args['ascending'].append(value == 'asc')
            self.log('info', f'sort column = {column}')

        # sort data
        if sort_args:
            sort_args['inplace'] = True
            self.df_copy.sort_values(**sort_args)

    def order(self):

        # drop hidden columns
        columns = [self.df.iloc[:,iloc].name for iloc in self.styler_copy.hidden_columns]
        self.df_copy.drop(columns=columns, inplace=True)
        self.styler_copy.hidden_columns = []

        # use ordered columns
        state_cols = json.loads(self.state_cols)
        if 'order' in state_cols:
            columns = [self.df.iloc[:,int(idx[5:])].name for idx in state_cols['order']]
            self.df_copy = self.df_copy.reindex(columns=columns)
            self.log('info', f'order columns = {columns}')

    def styles(self):

        # global table styles
        self.styler_copy.cell_ids = False
        self.styler_copy.table_attributes = 'class="pd-table"'
        self.styler_copy.set_table_styles(css_class_names={
            'row': 'pd-row-',
            'col': 'pd-col-',
            'level': 'pd-lvl-',
            'index_name': 'pd-index',
            'row_heading': 'pd-row-head',
            'col_heading': 'pd-col-head',
            'row_trim': 'pd-row-trim',
            'col_trim': 'pd-col-trim',
            'blank': 'pd-blank',
            'data': 'pd-data',
            'foot': 'pd-foot'
        }, overwrite=False)

        # column table styles
        column_styles = {}
        for col in self.df_copy.columns:
            iloc = self.df.columns.get_loc(col)
            column_styles[col] = [{ 'selector': 'th', 'props': [('--pd-df-iloc', f'iloc-{iloc}')] }]
        self.styler_copy.set_table_styles(table_styles=column_styles, overwrite=False, axis=0)

        # column format styles
        draggable = str(not isinstance(self.df_copy.columns, pd.MultiIndex)).lower()
        col_text = f'<span class="pd-col-text" draggable="{draggable}">{{0}}</span>'
        col_rescale_icon = '<span class="pd-col-i-rescale"><span></span></span>'
        col_filter_icon = '<span class="pd-col-i-filter"><span></span></span>'
        col_sort_icon = '<span class="pd-col-i-sort"><span></span></span>'
        col_format = f'{col_rescale_icon}{col_sort_icon}{col_text}{col_filter_icon}'
        self.styler_copy.format_index(lambda x: col_format.format(x), axis=1)

        # row table styles
        row_styles = {}
        for row in self.df_copy.index:
            iloc = self.df.index.get_loc(row)
            row_styles[row] = [{ 'selector': 'th', 'props': [('--pd-df-iloc', f'iloc-{iloc}')] }]
        self.styler_copy.set_table_styles(table_styles=row_styles, overwrite=False, axis=1)

        # row format styles
        row_text = '<span class="pd-row-text">{0}</span>'
        row_format = f'{row_text}'
        self.styler_copy.format_index(lambda x: row_format.format(x), axis=0)

        return self.chain(self.styler_copy, self.styler)

    def chain(self, styler1, styler2):
        def func(func1, func2):
            return lambda x: func1(func2(str(x)))
        styler = styler1._copy(True)

        # chain column labels format functions, maps (level, col)
        ckeys = list(styler._display_funcs_columns.keys())
        clocs1 = styler.columns.get_indexer_for(styler2.columns)
        clocs2 = styler.columns.get_indexer_for(styler1.columns)
        for cloc1, cloc2 in zip(clocs1, clocs2):
            cfunc1 = styler1._display_funcs_columns[ckeys[cloc1]]
            cfunc2 = styler2._display_funcs_columns[ckeys[cloc2]]
            styler._display_funcs_columns[ckeys[cloc1]] = func(cfunc1, cfunc2)

        # chain row labels format functions, maps (row, level)
        rkeys = list(styler._display_funcs_index.keys())
        rlocs1 = styler.index.get_indexer_for(styler2.index)
        rlocs2 = styler.index.get_indexer_for(styler1.index)
        for rloc1, rloc2 in zip(rlocs1, rlocs2):
            rfunc1 = styler1._display_funcs_index[rkeys[rloc1]]
            rfunc2 = styler2._display_funcs_index[rkeys[rloc2]]
            styler._display_funcs_index[rkeys[rloc1]] = func(rfunc1, rfunc2)

        # swap data labels format functions, maps (row, col)
        if len(styler._display_funcs) > 0:
            for rloc1, rloc2 in zip(rlocs1, rlocs2):
                for cloc1, cloc2 in zip(clocs1, clocs2):
                    rcfunc2 = styler2._display_funcs[(rloc2, cloc2)]
                    styler._display_funcs[(rloc1, cloc1)] = rcfunc2
        else:
            styler.format(precision=self.precision)

        return styler

    def log(self, level, message):
        levels = { 'info': 0, 'warn': 1, 'error': 2 }
        if not (levels[level] >= levels[module_log]):
            return

        # send log message to client
        self.logger = json.dumps({
            'date': f'{datetime.now().timestamp() * 1000:.0f}',
            'source': 'ipypandas, widget.py',
            'level': levels[level],
            'message': message
        })

    def __repr__(self):
        n_rows, n_cols = self.df_copy.shape
        return f'{type(self)}, {n_rows} rows × {n_cols} columns'


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
