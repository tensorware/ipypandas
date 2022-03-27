// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel, DOMWidgetView, ISerializers } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import '../css/widget.css';

export class PandasModel extends DOMWidgetModel {
    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
    };

    static model_name = 'PandasModel';
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;

    static view_name = 'PandasView';
    static view_module = MODULE_NAME;
    static view_module_version = MODULE_VERSION;

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
            _center_row: 0,
        };
    }
}

export class PandasView extends DOMWidgetView {
    render(): void {
        const classes = ['jp-RenderedHTMLCommon', 'jp-RenderedHTML', 'jp-OutputArea-output', 'jp-mod-trusted', 'pd-ipypandas'];
        if (window.matchMedia('(pointer: coarse)').matches) {
            classes.push('pd-touch');
        }
        this.el.classList.add(...classes);

        // init view
        this.update_data();

        // register change events
        this.model.on('change:view', this.update_data, this);
        this.model.on('change:upsync', this.reset_data, this);
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
        const query = this.model.get('search_query');
        const search = $('<div/>').addClass('pd-search');
        const input = $('<input/>').attr({ type: 'search', placeholder: 'Search...' });
        if (query) {
            search.addClass('pd-search-active');
        }
        input.val(query);
        search.append(input);
        footer.append(search);

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

    get_range(view: JQuery<HTMLElement>): any {
        const body = view.find('.pd-table > tbody');
        const row_height = body.find('tr:first').outerHeight() || 0;

        const n_rows = this.model.get('n_rows');
        const min_rows = this.model.get('min_rows');
        const max_rows = this.model.get('max_rows');
        const load_lazy = max_rows && n_rows > max_rows;

        const view_height = this.model.get('_view_height');
        const scroll_top = this.model.get('_scroll_top');
        const win_scale = this.model.get('win_sizefactor');

        // calculate view dimensions
        const view_rows = Math.max(min_rows, this.round_to(view_height, row_height) / row_height);
        const view_range = Math.round(win_scale * view_rows);

        // calculate row positions
        const center = this.round_to(Math.min(n_rows - 0.5 * view_range, scroll_top / row_height + 0.5 * view_range), row_height);
        const start = !load_lazy ? 0 : Math.max(0, center - view_range);
        const end = !load_lazy ? n_rows : Math.min(n_rows, center + view_range);

        return {
            start_row: start,
            center_row: center,
            end_row: end,
        };
    }

    set_range(view: JQuery<HTMLElement>): void {
        const body = view.find('.pd-table > tbody');
        const row_height = body.find('tr:first').outerHeight() || 0;

        // get viewport range
        const { start_row, center_row, end_row } = this.get_range(view);

        // set default center
        if (!this.model.get('_center_row')) {
            this.model.set('_center_row', center_row);
        }

        // set viewport padding
        const padding_top = start_row * row_height;
        const padding_bottom = (this.model.get('n_rows') - end_row) * row_height;
        body.css({
            '--pd-body-padding-top': padding_top + 'px',
            '--pd-body-padding-bottom': padding_bottom + 'px',
            '--pd-body-td-max-width': this.model.get('max_colwidth') + 'ch',
        });

        // set model range
        this.model.set('start_rows', start_row);
        this.model.set('end_rows', end_row);
    }

    set_height(view: JQuery<HTMLElement>): void {
        const head = view.find('.pd-table > thead');
        const body = view.find('.pd-table > tbody');
        const header_height = head.outerHeight() || 0;
        const row_height = body.find('tr:first').outerHeight() || 0;

        const n_rows = this.model.get('n_rows');
        const min_rows = this.model.get('min_rows');
        const max_rows = this.model.get('max_rows');
        const load_lazy = max_rows && n_rows > max_rows;

        // calculate height ranges
        let max_height = view.find('.pd-table').outerHeight() || 0;
        let min_height = Math.min(max_height, header_height + min_rows * row_height);

        // set viewport height
        view.css({
            '--pd-view-min-height': min_height + 'px',
            '--pd-view-max-height': max_height + 'px',
        });

        // increase viewport height (in case horizontal scrollbars exists)
        const scroll_bar_height = view[0].offsetHeight - view[0].clientHeight;
        max_height += scroll_bar_height;
        min_height += scroll_bar_height;
        view.css({
            '--pd-view-min-height': min_height + 'px',
            '--pd-view-max-height': max_height + 'px',
        });

        // set model height
        if (!this.model.get('_view_height')) {
            this.model.set('_view_height', !load_lazy ? max_height : min_height);
        } else {
            this.model.set('_view_height', view.height());
        }
    }

    on_resize(view: JQuery<HTMLElement>): boolean {
        if (this.model.get('_view_height') === view.height()) {
            return false;
        }

        // set model height
        this.model.set('_view_height', view.height());

        return this.on_scroll(view);
    }

    on_scroll(view: JQuery<HTMLElement>): boolean {
        const n_rows = this.model.get('n_rows');
        const max_rows = this.model.get('max_rows');
        const load_lazy = max_rows && n_rows > max_rows;

        // set model scroll
        this.model.set('_scroll_top', view.scrollTop() || 0);
        this.model.set('_scroll_left', view.scrollLeft() || 0);

        // calculate center position
        const { start_row, center_row, end_row } = this.get_range(view);
        const center_delta = Math.max(center_row - start_row, end_row - center_row) / 2;

        // update center and set range
        const update_range = Math.abs(center_row - this.model.get('_center_row')) >= center_delta;
        if (update_range && load_lazy) {
            this.model.set('_center_row', center_row);
            this.set_range(view);
            return true;
        }

        return false;
    }

    on_sort(th: JQuery<HTMLElement>): boolean {
        this.class_rotate(th, ['pd-sort-desc', 'pd-sort-asc', '']);

        const idx = th.css('--pd-df-iloc');
        const sort = this.class_suffix(th, 'pd-sort');
        const state_cols = JSON.parse(this.model.get('state_cols'));

        // create object
        if (!(idx in state_cols)) {
            state_cols[idx] = {};
        }

        // update object
        if (sort) {
            state_cols[idx]['sort'] = sort;
        } else {
            delete state_cols[idx];
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
        if (!(idx in state_rows)) {
            state_rows[idx] = {};
        }

        // update object
        if (select) {
            state_rows[idx]['select'] = select;
        } else {
            delete state_rows[idx];
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

    reset_data(): void {
        const view = $(this.el).children('.pd-view');

        // reset view state
        this.model.set('_scroll_top', 0);
        this.model.set('_scroll_left', 0);
        this.model.set('_view_height', 0);
        this.model.set('_center_row', 0);

        // set viewport range
        this.set_range(view);

        // set viewport height
        this.set_height(view);

        // send model to backend
        this.downsync('reset');
    }

    update_data(): void {
        /* TODO
         - fix lazy loading flickering
         - fix mouse scroll focus
        */
        const root = $(this.el);

        // hide root
        root.css({
            '--pd-root-opacity': '0',
            '--pd-root-cursor': 'progress',
            '--pd-root-min-height': (root.height() || 0) + 'px',
        });
        root.empty();

        // append view
        const view = this.get_view();
        root.append(view);

        // append footer
        const footer = this.get_footer();
        root.append(footer);

        // update table
        this.update_table();

        // update viewport
        this.update_view();

        // update footer
        this.update_footer();

        // handle view events
        $.when(view).then(() => {
            view.on('scroll', (e: JQuery.ScrollEvent) => {
                const target = $(e.target);

                // remove open filter
                root.find('.pd-filter').remove();
                root.find('.pd-col-head').removeClass('pd-filter-active');

                // vertical or horizontal scrolling
                if (this.on_scroll(target)) {
                    this.downsync('scroll');
                }
            });
            view.on('click', (e: JQuery.ClickEvent) => {
                const target = $(e.target);

                // remove open filter
                const filter = root.find('.pd-filter').remove();
                root.find('.pd-col-head').removeClass('pd-filter-active');

                // column header clicked
                const col_head = target.closest('.pd-col-head');
                if (col_head.length) {
                    if (target.is('.pd-col-i-filter')) {
                        if (!filter.length) {
                            root.append(this.get_filter(col_head));
                            col_head.addClass('pd-filter-active');
                        }
                    } else {
                        if (this.on_sort(col_head)) {
                            this.downsync('sort');
                        }
                    }
                    return;
                }

                // row index clicked
                const row_head = target.closest('.pd-row-head');
                if (row_head.length) {
                    if (this.on_select(row_head)) {
                        this.downsync('select');
                    }
                    return;
                }

                // resize handler clicked
                if (target.is('.pd-view')) {
                    if (this.on_resize(target)) {
                        this.downsync('resize');
                    }
                    return;
                }
            });

            // show root
            root.css({
                '--pd-root-opacity': '1',
                '--pd-root-cursor': 'auto',
                '--pd-root-min-height': 'initial',
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
                        this.downsync('search');
                    }
                }
            });
        });
    }

    update_table(): void {
        const view = $(this.el).children('.pd-view');
        const col_heads = view.find('.pd-col-head');
        const row_heads = view.find('.pd-row-head');

        // set column classes
        Object.entries(JSON.parse(this.model.get('state_cols'))).forEach(([idx, value]: [string, any]) => {
            const col = $.grep(col_heads, (th: HTMLElement) => {
                return $(th).css('--pd-df-iloc') === idx;
            });
            if (col.length && value.sort) {
                $(col.pop() || []).addClass(`pd-sort-${value.sort}`);
            }
        });

        // set row classes
        Object.entries(JSON.parse(this.model.get('state_rows'))).forEach(([idx, value]: [string, any]) => {
            const row = $.grep(row_heads, (th: HTMLElement) => {
                return $(th).css('--pd-df-iloc') === idx;
            });
            if (row.length && value.select) {
                $(row.pop() || []).addClass(`pd-select-${value.select}`);
            }
        });
    }

    update_view(): void {
        const view = $(this.el).children('.pd-view');

        // set scroll position
        view.scrollTop(this.model.get('_scroll_top'));
        view.scrollLeft(this.model.get('_scroll_left'));

        // set height
        view.css({ '--pd-view-height': this.model.get('_view_height') + 'px' });
    }

    update_footer(): void {
        const footer = $(this.el).children('.pd-footer');
        const view = $(this.el).children('.pd-view');
        const table = view.children('.pd-table');

        // set maximum width
        footer.css({ '--pd-footer-max-width': (table.width() || 0) + 'px' });
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
        const r = $.grep(classes, (x) => x.indexOf(match) === 0).join();
        return r.split('-').pop() || '';
    }

    round_to(number: number, multiple: number): number {
        return multiple * Math.round(number / multiple);
    }

    downsync(event: string): void {
        const root = $(this.el);

        // show progress
        root.css({ '--pd-root-cursor': 'progress' });

        // sync model with backend
        this.model.set('downsync', `${event}-${Date.now()}`);
        this.touch();
    }
}
