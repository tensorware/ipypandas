// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel, DOMWidgetView, ISerializers } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION, MODULE_SEMVER } from './version';
import '../src/styles/index.css';
import $ from 'jquery';

export class PandasModel extends DOMWidgetModel {
    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers
    };

    static model_name = 'PandasModel';
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_SEMVER;

    static view_name = 'PandasView';
    static view_module = MODULE_NAME;
    static view_module_version = MODULE_SEMVER;

    defaults(): any {
        return {
            ...super.defaults(),
            _model_name: PandasModel.model_name,
            _model_module: PandasModel.model_module,
            _model_module_version: PandasModel.model_module_version,
            _view_name: PandasModel.view_name,
            _view_module: PandasModel.view_module,
            _view_module_version: PandasModel.view_module_version,
            _scroll_top: 0,
            _scroll_left: 0,
            _view_height: 0,
            _head_height: 0,
            _row_height: 0
        };
    }
}

export class PandasView extends DOMWidgetView {
    render(): void {
        const classes = [];

        // append jupyter styles
        classes.push(['jp-RenderedHTMLCommon', 'jp-RenderedHTML', 'jp-OutputArea-output']);

        // append ipypandas styles
        classes.push('pd-root');
        if (window.matchMedia('(pointer: coarse)').matches) {
            classes.push('pd-touch');
        }

        // apply root styles
        const root = $(this.el);
        classes.forEach((cls) => {
            root.addClass(cls);
        });

        // update view
        this.update_data();

        // register change events
        this.model.on('change:log_msg', this.log_msg, this);
        this.model.on('change:sync_up', this.reset_data, this);
        this.model.on('change:view', this.update_data, this);
    }

    sync_down(event: string): void {
        const root = $(this.el);

        // show sync indicator
        root.css({ '--pd-root-cursor': 'wait' });

        // sync model with backend
        this.model.set('sync_down', `${event}-${Date.now()}`);
        this.touch();
    }

    get_view(): JQuery<HTMLElement> {
        const view = $('<div/>').addClass('pd-view');

        // html from pandas table
        view.html(this.model.get('view'));
        const table = view.children('.pd-table');

        // add table classes
        if (this.model.get('max_colwidth')) {
            table.addClass('pd-truncated');
        }
        if (!table.find('tr').length) {
            table.addClass('pd-empty');
        }

        return view;
    }

    get_footer(): JQuery<HTMLElement> {
        const footer = $('<div/>').addClass('pd-footer');

        // shape
        const n_rows = this.model.get('n_rows');
        const n_cols = this.model.get('n_cols');
        const shape = $('<div/>').addClass('pd-shape');
        const text = $('<p/>').text(`${n_rows} rows × ${n_cols} columns`);
        shape.append(text);
        footer.append(shape);

        // search
        if (n_cols) {
            const query = this.model.get('search_query');
            const search = $('<div/>').addClass('pd-search');
            const input = $('<input/>').attr({ type: 'search', placeholder: 'Search...' });
            if (query) {
                search.addClass('pd-search-active');
            }
            input.val(query);
            search.append(input);
            footer.append(search);
        }
        this.log('info', `using ${n_rows} rows and ${n_cols} columns`);

        return footer;
    }

    get_filter(th: JQuery<HTMLElement>): JQuery<HTMLElement> {
        const filter = $('<div/>').addClass('pd-filter');

        // calculate position
        const view = th.closest('.pd-view');
        const tr = th.closest('tr');

        const top = (tr.offset()?.top || 0) - (view.offset()?.top || 0);
        const height = tr.outerHeight(true) || 0;

        const left = (th.offset()?.left || 0) - (view.offset()?.left || 0);
        const width = th.outerWidth(true) || 0;

        filter.offset({ top: top + height + 2, left: left + width - 2 });

        // TODO: filter dialog
        filter.append('More to come...');

        // animate fade-in
        $.when(filter).then(() => {
            filter.css({ '--pd-filter-opacity': '1' });
        });

        return filter;
    }

    get_range(scale: number): any {
        const n_rows = this.model.get('n_rows');
        const max_rows = this.model.get('max_rows');
        const row_height = this.model.get('_row_height');
        const load_lazy = max_rows > 0 && n_rows > max_rows;

        // screen height is used as maximum viewport size
        const window_rows = this.round_to(window.screen.height, row_height) / row_height;
        const margin_rows = Math.round(window_rows * scale);

        // scroll row position is used as center position
        const scroll_top = this.model.get('_scroll_top') || 0;
        const scroll_row = this.clamp_value(this.round_to(scroll_top, row_height) / row_height, 0, n_rows);

        // calculate start and end row
        const start_row = !load_lazy ? 0 : this.clamp_value(scroll_row - margin_rows, 0, n_rows);
        const end_row = !load_lazy ? n_rows : this.clamp_value(scroll_row + margin_rows, 0, n_rows);

        return {
            start_row: start_row || 0,
            end_row: end_row || 0
        };
    }

    set_range(view: JQuery<HTMLElement>): void {
        const head = view.find('.pd-table > thead');
        const body = view.find('.pd-table > tbody');

        // set header height
        const head_height = head.outerHeight() || -1;
        if (head_height >= 0) {
            this.model.set('_head_height', head_height);
        }

        // set row height
        const row_height = body.find('tr:first').outerHeight() || -1;
        if (row_height >= 0) {
            this.model.set('_row_height', row_height);
        }

        // set viewport padding
        const { start_row, end_row } = this.get_range(4);
        const padding_top = start_row * this.model.get('_row_height');
        const padding_bottom = (this.model.get('n_rows') - end_row) * this.model.get('_row_height');
        body.css({
            '--pd-body-padding-top': `${padding_top}px`,
            '--pd-body-padding-bottom': `${padding_bottom}px`,
            '--pd-body-td-max-width': `${this.model.get('max_colwidth')}ch`
        });

        // set model range
        this.log('info', `set range from ${start_row} to ${end_row} (${end_row - start_row} rows)`);
        this.model.set('start_row', start_row);
        this.model.set('end_row', end_row);
    }

    set_height(view: JQuery<HTMLElement>): void {
        const n_rows = this.model.get('n_rows');
        const min_rows = this.model.get('min_rows');
        const max_rows = this.model.get('max_rows');
        const load_lazy = max_rows > 0 && n_rows > max_rows;

        // calculate height ranges
        let max_height = view.find('.pd-table').outerHeight() || 0;
        let min_height = Math.min(max_height, this.model.get('_head_height') + min_rows * this.model.get('_row_height'));
        const resize = min_height === max_height ? 'none' : 'vertical';

        // set viewport height
        view.css({
            '--pd-view-resize': resize,
            '--pd-view-min-height': `${min_height}px`,
            '--pd-view-max-height': `${max_height}px`
        });

        // increase viewport height (in case horizontal scrollbars exists)
        const scroll_bar_height = view[0].offsetHeight - view[0].clientHeight;
        max_height += scroll_bar_height;
        min_height += scroll_bar_height;
        view.css({
            '--pd-view-min-height': `${min_height}px`,
            '--pd-view-max-height': `${max_height}px`
        });

        // set model height
        let height = view.height();
        if (!this.model.get('_view_height')) {
            height = load_lazy ? min_height : max_height;
        }
        this.log('info', `set view height to ${height} px`);
        this.model.set('_view_height', height);
    }

    on_scroll(view: JQuery<HTMLElement>): boolean {
        const n_rows = this.model.get('n_rows');
        const max_rows = this.model.get('max_rows');
        const load_lazy = max_rows > 0 && n_rows > max_rows;

        // set scroll top
        const scroll_top = view.scrollTop() || -1;
        if (scroll_top >= 0) {
            this.model.set('_scroll_top', scroll_top);
        }

        // set scroll left
        const scroll_left = view.scrollLeft() || -1;
        if (scroll_left >= 0) {
            this.model.set('_scroll_left', scroll_left);
        }

        // compare viewport
        const { start_row, end_row } = this.get_range(1);
        const prev_start_row = this.model.get('start_row');
        const prev_end_row = this.model.get('end_row');

        // update range
        const update_range = start_row < prev_start_row || prev_end_row < end_row;
        if (update_range && load_lazy) {
            this.set_range(view);
            return true;
        }

        return false;
    }

    on_resize(view: JQuery<HTMLElement>): boolean {
        if (this.model.get('_view_height') === view.height()) {
            return false;
        }

        // set viewport height
        this.set_height(view);

        return this.on_scroll(view);
    }

    on_reorder(view: JQuery<HTMLElement>): boolean {
        const col_heads = view.find('.pd-col-head');
        const state_cols = JSON.parse(this.model.get('state_cols'));

        // update object
        state_cols['order'] = $.map(col_heads, (th: HTMLElement, i: number) => {
            return $(th).css('--pd-df-iloc');
        });

        // set model col
        this.model.set('state_cols', JSON.stringify(state_cols));

        return true;
    }

    on_rescale(th: JQuery<HTMLElement>): boolean {
        const idx = th.css('--pd-df-iloc');
        const width = th.find('.pd-col-i-rescale > span').width() || 0;
        const state_cols = JSON.parse(this.model.get('state_cols'));

        // create object
        if (!('width' in state_cols)) {
            state_cols['width'] = {};
        }
        if (!(idx in state_cols['width'])) {
            state_cols['width'][idx] = {};
        }

        // update object
        if (width) {
            state_cols['width'][idx] = width;
        } else {
            delete state_cols['width'][idx];
        }

        // set model col
        this.model.set('state_cols', JSON.stringify(state_cols));

        return true;
    }

    on_sort(th: JQuery<HTMLElement>): boolean {
        this.class_rotate(th, ['pd-sort-desc', 'pd-sort-asc', '']);

        const idx = th.css('--pd-df-iloc');
        const sort = this.class_suffix(th, 'pd-sort');
        const state_cols = JSON.parse(this.model.get('state_cols'));

        // create object
        if (!('sort' in state_cols)) {
            state_cols['sort'] = {};
        }
        if (!(idx in state_cols['sort'])) {
            state_cols['sort'][idx] = {};
        }

        // update object
        if (sort) {
            state_cols['sort'][idx] = sort;
        } else {
            delete state_cols['sort'][idx];
        }

        // set model col
        this.model.set('state_cols', JSON.stringify(state_cols));

        return true;
    }

    on_select(th: JQuery<HTMLElement>): boolean {
        this.class_rotate(th, ['pd-select-active', '']);

        const idx = th.css('--pd-df-iloc');
        const select = this.class_suffix(th, 'pd-select');
        const state_rows = JSON.parse(this.model.get('state_rows'));

        // create object
        if (!('select' in state_rows)) {
            state_rows['select'] = {};
        }
        if (!(idx in state_rows['select'])) {
            state_rows['select'][idx] = {};
        }

        // update object
        if (select) {
            state_rows['select'][idx] = select;
        } else {
            delete state_rows['select'][idx];
        }

        // set model row
        this.model.set('state_rows', JSON.stringify(state_rows));

        return true;
    }

    on_search(input: JQuery<HTMLElement>): boolean {
        const search = input.closest('.pd-search');
        const query = `${input.val()}`.trim();

        // set input style
        if (query) {
            search.addClass('pd-search-active');
        } else {
            search.removeClass('pd-search-active');
        }

        // set model query
        this.model.set('search_query', query);

        return true;
    }

    reset_styles(): void {
        const root = $(this.el);

        // reset style variables
        root.css({ '--pd-header-color': '', '--pd-border-color': '', '--pd-body-tr-select-color': '' });

        // update view
        this.update_data();
    }

    reset_data(): void {
        const root = $(this.el);
        const view = root.children('.pd-view');

        // reset view state
        this.model.set('_scroll_top', 0);
        this.model.set('_scroll_left', 0);
        this.model.set('_view_height', 0);

        // set viewport range
        this.set_range(view);

        // set viewport height
        this.set_height(view);

        // send model to backend
        this.sync_down('reset');
    }

    update_data(): void {
        this.log('info', `------ client update (${MODULE_NAME} v${MODULE_VERSION}) ------`);

        // reset root
        const root = $(this.el);
        root.css({
            '--pd-root-opacity': '0',
            '--pd-root-cursor': 'wait',
            '--pd-root-min-height': `${root.height() || 0}px`
        });

        $.when(root).then(() => {
            root.empty();

            // append view
            const view = this.get_view();
            root.append(view);

            // append footer
            const footer = this.get_footer();
            root.append(footer);

            // update container
            this.update_container();

            // update table
            this.update_table();

            // update viewport
            this.update_view();

            // update footer
            this.update_footer();

            // handle view events
            $.when(view).then(() => {
                view.on('dragstart', (e: JQuery.DragStartEvent) => {
                    view.data('dragged', $(e.target).closest('.pd-col-head'));
                });
                view.on('dragover', (e: JQuery.DragOverEvent) => {
                    const dragged = view.data('dragged');
                    if (!dragged) {
                        return;
                    }

                    // remove dragover class
                    view.find('.pd-col-head').removeClass('pd-dragover');

                    // add dragover class
                    $(e.target).closest('.pd-col-head').addClass('pd-dragover');

                    // prevent default behavior
                    e.preventDefault();
                    e.stopPropagation();
                });
                view.on('drop', (e: JQuery.DropEvent) => {
                    const dragged = view.data('dragged');
                    const dropped = $(e.target).closest('.pd-col-head');
                    if (!dragged.is('.pd-col-head') || !dropped.is('.pd-col-head') || dragged.is(dropped)) {
                        return;
                    }
                    view.removeData('dragged');

                    // reorder columns
                    $(dragged).insertAfter(dropped);
                    if (this.on_reorder(view)) {
                        this.sync_down('reorder');
                    }
                });
                view.on('dragend', (e: JQuery.DragEndEvent) => {
                    view.find('.pd-col-head').removeClass('pd-dragover');
                });
                view.on('scroll', (e: JQuery.ScrollEvent) => {
                    this.compress('scroll', () => {
                        const target = $(e.target);

                        // remove open filter
                        root.find('.pd-filter').remove();
                        root.find('.pd-col-head').removeClass('pd-filter-active');

                        // vertical or horizontal scrolling
                        if (this.on_scroll(target)) {
                            this.sync_down('scroll');
                        }
                    });
                });
                view.on('click', (e: JQuery.ClickEvent) => {
                    const target = $(e.target);

                    // remove open filter
                    const filter = root.find('.pd-filter').remove();
                    root.find('.pd-col-head').removeClass('pd-filter-active');

                    // column header clicked
                    const col_head = target.closest('.pd-col-head:not([colspan])');
                    if (col_head.length) {
                        this.on_rescale(col_head);

                        const col_filter = target.closest('.pd-col-i-filter');
                        if (col_filter.length) {
                            if (!filter.length) {
                                root.append(this.get_filter(col_head));
                                col_head.addClass('pd-filter-active');
                            }
                        } else {
                            if (this.on_sort(col_head)) {
                                this.sync_down('sort');
                            }
                        }
                        return;
                    }

                    // row index clicked
                    const row_head = target.closest('.pd-row-head:not([rowspan])');
                    if (row_head.length) {
                        if (this.on_select(row_head.parent().find('.pd-row-head'))) {
                            this.sync_down('select');
                        }
                        return;
                    }

                    // resize handler clicked
                    if (target.is('.pd-view')) {
                        if (this.on_resize(target)) {
                            this.sync_down('resize');
                        }
                        return;
                    }
                });

                // show root
                root.css({
                    '--pd-root-opacity': '1',
                    '--pd-root-cursor': 'auto',
                    '--pd-root-min-height': 'initial'
                });

                // set viewport range
                this.set_range(view);

                // set viewport height
                this.set_height(view);

                // update table
                this.update_table();

                // update viewport
                this.update_view();

                // update footer
                this.update_footer();
            });

            // handle footer events
            $.when(footer).then(() => {
                footer.on('keyup', (e: JQuery.KeyUpEvent) => {
                    const target = $(e.target);
                    const enter = e.key === 'Enter';

                    // search box query
                    const search = target.closest('.pd-search');
                    if (search.length) {
                        if (this.on_search(target) && enter) {
                            this.sync_down('search');
                        }
                    }
                });
            });
        });
    }

    update_container(): void {
        const root = $(this.el);
        const container = root.parent();

        // initialize container styles
        if (!container.hasClass('pd-ipypandas')) {
            container.addClass('pd-ipypandas');

            // remove vscode styles (https://github.com/microsoft/vscode-jupyter/issues/7161#issuecomment-1433728616)
            root.parents('.cell-output-ipywidget-background').removeClass('cell-output-ipywidget-background');
        }
    }

    update_table(): void {
        const root = $(this.el);
        const view = root.children('.pd-view');
        const head = view.find('.pd-table > thead');

        const col_heads = view.find('.pd-col-head');
        const row_heads = view.find('.pd-row-head');

        const state_cols = JSON.parse(this.model.get('state_cols'));
        const state_rows = JSON.parse(this.model.get('state_rows'));

        // set column header width
        if ('width' in state_cols) {
            Object.entries(state_cols['width']).forEach(([idx, value]: [string, any]) => {
                const col = $.grep(col_heads, (th: HTMLElement) => {
                    return $(th).css('--pd-df-iloc') === idx;
                });
                const rescale = $(col).find('.pd-col-i-rescale > span');
                rescale.css({ width: `${value}px` });
            });
        }

        // set column classes
        if ('sort' in state_cols) {
            Object.entries(state_cols['sort']).forEach(([idx, value]: [string, any]) => {
                const col = $.grep(col_heads, (th: HTMLElement) => {
                    return $(th).css('--pd-df-iloc') === idx;
                });
                $(col).addClass(`pd-sort-${value}`);
            });
        }

        // set row classes
        if ('select' in state_rows) {
            Object.entries(state_rows['select']).forEach(([idx, value]: [string, any]) => {
                const row = $.grep(row_heads, (th: HTMLElement) => {
                    return $(th).css('--pd-df-iloc') === idx;
                });
                $(row).addClass(`pd-select-${value}`);
            });
        }

        // set index name position
        let offset_index = -1;
        view.find('th.pd-index').each((i: number, th: HTMLElement) => {
            const left = $(th).position().left;
            offset_index = offset_index < 0 ? left : offset_index;
            $(th).css({ left: `${left - offset_index}px` });
        });

        // set index value position
        let offset_row = -1;
        view.find('th.pd-row-head').each((i: number, th: HTMLElement) => {
            const left = $(th).position().left;
            offset_row = offset_row < 0 ? left : offset_row;
            $(th).css({ left: `${left - offset_row}px` });
        });

        // update header styles
        root.css({ '--pd-header-color': this.background_color(col_heads) });
        root.css({ '--pd-border-color': head.css('border-bottom-color') });

        // update index styles
        const select_color = root.css('--pd-body-tr-select-color');
        if (select_color && select_color.includes('rgba')) {
            const bg_color = this.hex_to_rgb(root.css('--pd-header-color'));
            root.css({ '--pd-body-tr-select-color': this.rgba_to_rgb(select_color, bg_color) });
        }
    }

    update_view(): void {
        const root = $(this.el);
        const view = root.children('.pd-view');

        // set scroll position
        view.scrollTop(this.model.get('_scroll_top'));
        view.scrollLeft(this.model.get('_scroll_left'));

        // set height
        view.css({ '--pd-view-height': `${this.model.get('_view_height')}px` });
    }

    update_footer(): void {
        const root = $(this.el);
        const footer = root.children('.pd-footer');
        const view = root.children('.pd-view');
        const table = view.children('.pd-table');

        // set maximum width
        footer.css({ '--pd-footer-max-width': `${table.width() || 0}px` });
    }

    class_rotate(target: JQuery<HTMLElement>, classes: string[]): string {
        for (let i = 0; i < classes.length; i++) {
            if (target.hasClass(classes[i])) {
                // remove old class
                target.removeClass(classes[i]);

                // add new class
                i = i >= classes.length ? 0 : i + 1;
                if (classes[i]) {
                    target.addClass(classes[i]);
                }

                return classes[i];
            }
        }

        // default class
        target.addClass(classes[0]);
        return classes[0];
    }

    class_suffix(target: JQuery<HTMLElement>, match: string): string {
        const classes = (target.attr('class') || '').split(/\s+/);
        const result = $.grep(classes, (x) => x.indexOf(match) === 0).join();
        return result.split('-').pop() || '';
    }

    background_color(el: JQuery<HTMLElement>) {
        const elements = el.parents().addBack();
        const parents = elements.filter((i: number, p: HTMLElement) => {
            return !['', 'undefined', 'transparent', 'rgba(0, 0, 0, 0)'].includes($(p).css('background-color'));
        });
        return parents.last().css('background-color');
    }

    rgba_to_rgb(fgrgba: string, bgrgb: string): string {
        const [fgr, fgg, fgb, fga] = $.map(fgrgba.substring(fgrgba.indexOf('(') + 1, fgrgba.lastIndexOf(')')).split(/,\s*/), Number);
        const [bgr, bgg, bgb] = $.map(bgrgb.substring(bgrgb.indexOf('(') + 1, bgrgb.lastIndexOf(')')).split(/,\s*/), Number);
        const fgrgb = {
            r: Math.round((fga * (fgr / 255) + (1 - fga) * (bgr / 255)) * 255),
            g: Math.round((fga * (fgg / 255) + (1 - fga) * (bgg / 255)) * 255),
            b: Math.round((fga * (fgb / 255) + (1 - fga) * (bgb / 255)) * 255)
        };
        return `rgb(${fgrgb.r}, ${fgrgb.g}, ${fgrgb.b})`;
    }

    hex_to_rgb(hex: string): string {
        if (!hex.includes('#')) {
            return hex;
        }
        const str = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b);
        const [r, g, b] = (str.substring(1).match(/.{2}/g) || []).map((x) => parseInt(x, 16));
        return `rgb(${r}, ${g}, ${b})`;
    }

    clamp_value(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    round_to(value: number, multiple: number): number {
        return multiple * Math.round(value / multiple);
    }

    compress(event: string, handler: TimerHandler, delay = 200): void {
        const timers = this.compress as any;
        clearTimeout(timers[event] || -1);
        timers[event] = setTimeout(handler, delay);
    }

    log(level: string, message: string): void {
        const levels: { [key: string]: any } = { debug: 0, info: 1, warn: 2, error: 3 };
        if (!(levels[level] >= levels[this.model.get('log_level')])) {
            return;
        }

        // send log message to console
        this.log_msg(
            this,
            JSON.stringify({
                date: `${Date.now()}`,
                source: 'widget.ts',
                level: levels[level],
                message: message
            })
        );
    }

    log_msg(ctx: object, json: string): void {
        const log = JSON.parse(json);
        const date = new Date(parseInt(log.date)).toLocaleString();

        const msg = `${date}, ${log.source}: ${log.message}`;
        switch (log.level) {
            case 0:
                console.debug(msg);
                break;
            case 1:
                console.info(msg);
                break;
            case 2:
                console.warn(msg);
                break;
            case 3:
                console.error(msg);
                break;
            default:
                console.log(msg);
        }
    }
}
