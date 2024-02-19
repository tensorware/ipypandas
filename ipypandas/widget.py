#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import json
import traceback
import pandas as pd

from time import time
from datetime import datetime
from decorator import decorator
from collections import defaultdict
from pandas.io.formats.style import Styler

from ipywidgets import DOMWidget, register
from traitlets import Instance, Unicode, Integer, observe

from IPython.display import display
from IPython.core.getipython import get_ipython

from .version import module_name, module_version, module_semver


@register
class PandasWidget(DOMWidget):

    # module version of pandas widget
    _model_name = Unicode('PandasModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_semver).tag(sync=True)

    # view version of pandas widget
    _view_name = Unicode('PandasView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_semver).tag(sync=True)

    # logging
    log_msg = Unicode('{}').tag(sync=True)
    log_level = Unicode('warn').tag(sync=True)

    # sync flags between client and server
    sync_up = Unicode('').tag(sync=True)
    sync_down = Unicode('').tag(sync=True)

    # data
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

        # init empty data and styler
        self.df = pd.DataFrame()
        self.styler = Styler(self.df)
        self.df_copy = pd.DataFrame()
        self.styler_copy = Styler(self.df_copy)

        # init existing data and styler
        if 'df' in kwargs:
            self.df = kwargs['df']
            self.styler = Styler(self.df)
        elif 'styler' in kwargs:
            self.df = kwargs['styler'].data
            self.styler = kwargs['styler']

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
        self.end_row = min(self.n_rows, 500) if self.max_rows > 0 and self.n_rows > self.max_rows else self.n_rows

        # init view by simulated client update
        self.sync_down = f'init-{datetime.now().timestamp() * 1000:.0f}'

        # init pandas widget
        super(PandasWidget, self).__init__(**kwargs)

    def timeit(func):
        def wrapper(func, *args, **kwargs):
            self = args[0]
            start = time()
            try:
                result = func(*args, **kwargs)
            except Exception:
                self.log('error', traceback.format_exc())
            end = time()
            self.log('debug', f'{func.__name__} executed in {(end - start) * 1000:.2f} ms')
            return result
        return decorator(wrapper, func)

    @observe('sync_down')
    def update(self, change):
        self.log('info', f'------ host update ({module_name} v{module_version}) ------')

        # copy original data
        self.df_copy = self.df.copy()
        self.styler_copy = self.styler._copy(True)

        # update data
        self.filter()
        self.search()
        self.sort()
        self.order()

        # update viewport data
        self.n_rows, self.n_cols = self.df_copy.shape
        self.df_copy = self.df_copy.iloc[self.start_row:self.end_row]

        # reset viewport dimensions
        event = change.new.split('-')[0]
        if event in ['search']:
            self.sync_up = f'reset-{datetime.now().timestamp() * 1000:.0f}'
            return

        # update viewport representation
        self.styler_copy.data = self.df_copy
        self.view = self.styles().to_html()

    @timeit
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

    @timeit
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

    @timeit
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

    @timeit
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

    @timeit
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
        cols = self.df_copy.columns.unique()
        styles = {col:[{'selector':'th', 'props':[('--pd-df-iloc', f'iloc-{iloc}')]}] for col, iloc in zip(cols, self.df.columns.get_indexer_for(cols))}
        self.styler_copy.set_table_styles(table_styles=styles, overwrite=False, axis=0)

        # column format styles
        draggable = str(not isinstance(self.df_copy.columns, pd.MultiIndex)).lower()
        col_text = f'<span class="pd-col-text" draggable="{draggable}">{{0}}</span>'
        col_rescale_icon = '<span class="pd-col-i-rescale"><span></span></span>'
        col_filter_icon = '<span class="pd-col-i-filter"><span></span></span>'
        col_sort_icon = '<span class="pd-col-i-sort"><span></span></span>'
        col_format = f'{col_rescale_icon}{col_sort_icon}{col_text}{col_filter_icon}'
        self.styler_copy.format_index(lambda x: col_format.format(x), axis=1)

        # row table styles
        rows = self.df_copy.index.unique()
        styles = {row:[{'selector':'th', 'props':[('--pd-df-iloc', f'iloc-{iloc}')]}] for row, iloc in zip(rows, self.df.index.get_indexer_for(rows))}
        self.styler_copy.set_table_styles(table_styles=styles, overwrite=False, axis=1)

        # row format styles
        row_text = '<span class="pd-row-text">{0}</span>'
        row_format = f'{row_text}'
        self.styler_copy.format_index(lambda x: row_format.format(x), axis=0)

        return self.chain(self.styler_copy._copy(False), self.styler)

    @timeit
    def chain(self, styler1, styler2):
        def func(func1, func2):
            return lambda x: func1(func2(x))

        # chain column labels format functions, maps (level, col)
        ckeys = list(styler1._display_funcs_columns.keys())
        clocs = [cloc for cloc in enumerate(styler1.columns.get_indexer_for(styler2.data.columns.unique())) if cloc[1] >= 0]
        for cloc2, cloc1 in clocs:
            cfunc1 = styler1._display_funcs_columns[ckeys[cloc1]]
            cfunc2 = styler2._display_funcs_columns[ckeys[cloc2]]
            styler1._display_funcs_columns[ckeys[cloc1]] = func(cfunc1, cfunc2)

        # chain row labels format functions, maps (row, level)
        rkeys = list(styler1._display_funcs_index.keys())
        rlocs = [rloc for rloc in enumerate(styler1.index.get_indexer_for(styler2.data.index.unique())) if rloc[1] >= 0]
        for rloc2, rloc1 in rlocs:
            rfunc1 = styler1._display_funcs_index[rkeys[rloc1]]
            rfunc2 = styler2._display_funcs_index[rkeys[rloc2]]
            styler1._display_funcs_index[rkeys[rloc1]] = func(rfunc1, rfunc2)

        # swap data labels format functions, maps (row, col)
        if len(styler1._display_funcs) > 0:
            for rloc2, rloc1 in rlocs:
                for cloc2, cloc1 in clocs:
                    rcfunc2 = styler2._display_funcs[(rloc2, cloc2)]
                    styler1._display_funcs[(rloc1, cloc1)] = rcfunc2
        else:
            styler1.format(precision=self.precision)

        return styler1

    def log(self, lvl, msg):
        levels = { 'debug': 0, 'info': 1, 'warn': 2, 'error': 3 }
        if not (levels[lvl] >= levels[self.log_level]):
            return

        # send log message to client
        self.log_msg = json.dumps({
            'date': f'{datetime.now().timestamp() * 1000:.0f}',
            'source': 'widget.py',
            'level': levels[lvl],
            'message': msg
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
    fmt = formatter()
    if fmt is None:
        return
    fmt.for_type(pd.DataFrame, lambda df: display(PandasWidget(df=df, **kwargs)))
    fmt.for_type(Styler, lambda styler: display(PandasWidget(styler=styler, **kwargs)))


def disable():
    fmt = formatter()
    if fmt is None:
        return
    fmt.type_printers.pop(pd.DataFrame, None)
    fmt.type_printers.pop(Styler, None)
