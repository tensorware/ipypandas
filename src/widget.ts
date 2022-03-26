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
            _center_row: 0,
            _view_height: 0,
            _view_rows: 0,
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
        this.model.on('change:n_rows', this.reset_data, this);
        this.model.on('change:n_cols', this.reset_data, this);
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
        const shape = $('<p/>').addClass('pd-shape');
        shape.text(`${n_rows} rows × ${n_cols} columns`);
        footer.append(shape);

        // search
        const search = $('<div/>').addClass('pd-search');
        const input = $('<input/>').attr({ type: 'search', placeholder: 'Search...' });
        input.val(this.model.get('search_query'));
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
        filter.append(th.text());

        return filter;
    }

    set_range(view: JQuery<HTMLElement>): void {
        const body = view.find('.pd-table > tbody');

        // get dimensions
        const row_height = body.find('tr:first').outerHeight() || 0;
        const lazy_load = this.model.get('max_rows') && this.model.get('n_rows') > this.model.get('max_rows');

        // init default values
        if (!this.model.get('_center_row')) {
            this.model.set('_center_row', 0.5 * this.model.get('win_sizefactor') * this.model.get('min_rows'));
        }
        if (!this.model.get('_view_rows')) {
            this.model.set('_view_rows', this.model.get('min_rows'));
        }

        // calculate row ranges
        const range = this.model.get('win_sizefactor') * this.model.get('_view_rows');
        let start_rows = Math.max(0, this.model.get('_center_row') - range);
        let end_rows = Math.min(this.model.get('n_rows'), this.model.get('_center_row') + range);
        if (!lazy_load) {
            start_rows = 0;
            end_rows = this.model.get('n_rows');
        }

        // set viewport padding
        const padding_top = start_rows * row_height;
        const padding_bottom = (this.model.get('n_rows') - end_rows) * row_height;
        body.css({
            '--pd-body-padding-top': padding_top + 'px',
            '--pd-body-padding-bottom': padding_bottom + 'px',
            '--pd-body-td-max-width': this.model.get('max_colwidth') + 'ch',
        });

        // set model range
        this.model.set('start_rows', start_rows);
        this.model.set('end_rows', end_rows);
    }

    set_height(view: JQuery<HTMLElement>): void {
        const head = view.find('.pd-table > thead');
        const body = view.find('.pd-table > tbody');

        // get dimensions
        const header_height = head.outerHeight() || 0;
        const row_height = body.find('tr:first').outerHeight() || 0;
        const lazy_load = this.model.get('max_rows') && this.model.get('n_rows') > this.model.get('max_rows');

        // calculate height ranges
        let max_height = view.find('.pd-table').outerHeight() || 0;
        let min_height = Math.min(max_height, header_height + this.model.get('min_rows') * row_height);

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
            this.model.set('_view_height', !lazy_load ? max_height : min_height);
        } else {
            this.model.set('_view_height', view.height());
        }
    }

    on_resize(view: JQuery<HTMLElement>): boolean {
        const body = view.find('.pd-table > tbody');
        const row_height = body.find('tr:first').outerHeight() || 0;

        // unchanged height
        if (this.model.get('_view_height') === view.height()) {
            return false;
        }

        // set model height
        this.model.set('_view_height', view.height());

        // set model rows
        this.model.set('_view_rows', this.round_to(this.model.get('_view_height'), row_height) / row_height);

        // set viewport range
        this.set_range(view);

        // set viewport height
        this.set_height(view);

        return true;
    }

    on_scroll(view: JQuery<HTMLElement>): boolean {
        const body = view.find('.pd-table > tbody');
        const row_height = body.find('tr:first').outerHeight() || 0;
        const lazy_load = this.model.get('max_rows') && this.model.get('n_rows') > this.model.get('max_rows');

        // set model scroll
        this.model.set('_scroll_top', this.round_to(view.scrollTop() || 0, row_height));
        this.model.set('_scroll_left', view.scrollLeft() || 0);

        // set model position
        const center_delta = 0.5 * this.model.get('win_sizefactor') * this.model.get('_view_rows');
        const center_row = this.model.get('_scroll_top') / row_height + center_delta;
        const update_range = Math.abs(center_row - this.model.get('_center_row')) >= center_delta;

        if (update_range && lazy_load) {
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
        this.class_rotate(th, ['pd-select-checked', '']);

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
        const query = String(input.val()).trim();

        // set model query
        this.model.set('search_query', query);

        return true;
    }

    reset_data(): void {
        const view = $(this.el).children('.pd-view');

        // reset view state
        this.model.set('_scroll_top', 0);
        this.model.set('_scroll_left', 0);
        this.model.set('_center_row', 0);
        this.model.set('_view_height', 0);
        this.model.set('_view_rows', 0);

        // set viewport range
        this.set_range(view);

        // set viewport height
        this.set_height(view);

        // send message
        this.send_message('reset');
    }

    update_data(): void {
        /* TODO
         - fix lazy loading flickering
         - fix mouse scroll focus
        */
        const root = $(this.el).empty();

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

        // handle view events
        $.when(view).then(() => {
            view.on('scroll', (e: JQuery.ScrollEvent) => {
                const target = $(e.target);

                // remove open filter
                root.find('.pd-filter').remove();
                root.find('.pd-col-head').removeClass('pd-filter-active');

                // vertical or horizontal scrolling
                if (this.on_scroll(target)) {
                    this.send_message('scroll');
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
                            this.send_message('sort');
                        }
                    }
                    return;
                }

                // row index clicked
                const row_head = target.closest('.pd-row-head');
                if (row_head.length) {
                    if (this.on_select(row_head)) {
                        this.send_message('select');
                    }
                    return;
                }

                // resize handler clicked
                if (target.is('.pd-view')) {
                    if (this.on_resize(target)) {
                        this.send_message('resize');
                    }
                    return;
                }
            });

            // set viewport range
            this.set_range(view);

            // set viewport height
            this.set_height(view);

            // update viewport
            this.update_view();
        });

        // handle footer events
        $.when(footer).then(() => {
            footer.on('keydown', (e: JQuery.KeyDownEvent) => {
                const target = $(e.target);

                // handle only enter key
                if (e.key !== 'Enter') {
                    return true;
                }

                // search box query
                const search = target.closest('.pd-search');
                if (search.length) {
                    if (this.on_search(target)) {
                        this.send_message('search');
                    }
                }
            });
        });
    }

    update_table(): void {
        const view = $(this.el).children('.pd-view');

        // set column classes
        Object.entries(JSON.parse(this.model.get('state_cols'))).forEach(([idx, value]: [string, any]) => {
            const col = $.grep(view.find('.pd-col-head'), (th: HTMLElement) => {
                return $(th).css('--pd-df-iloc') === idx;
            });
            if (col.length && value.sort) {
                $(col.pop() || []).addClass(`pd-sort-${value.sort}`);
            }
        });

        // set row classes
        Object.entries(JSON.parse(this.model.get('state_rows'))).forEach(([idx, value]: [string, any]) => {
            const row = $.grep(view.find('.pd-row-head'), (th: HTMLElement) => {
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
        view.height(this.model.get('_view_height'));
    }

    send_message(event: string): void {
        // sync model with backend
        this.model.save_changes();

        // send message to backend
        this.send({
            event: event,
        });
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
}
