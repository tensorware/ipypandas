// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel, DOMWidgetView, ISerializers } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import '../css/widget.css';

/*
TODO
  - fix lazy loading flickering
  - fix mouse scroll focus
*/

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
        console.log('---------- render ----------');

        this.el.classList.add(...['jp-RenderedHTMLCommon', 'jp-RenderedHTML', 'jp-OutputArea-output', 'jp-mod-trusted', 'pd-ipypandas']);

        // init
        this.update_data();

        // register change events
        this.model.on('change:view', this.update_data, this);

        this.model.on('change:start_rows', this.update_data, this);
        this.model.on('change:end_rows', this.update_data, this);

        this.model.on('change:state_cols', this.update_table, this);
        this.model.on('change:state_rows', this.update_table, this);

        this.model.on('change:_scroll_top', this.update_view, this);
        this.model.on('change:_scroll_left', this.update_view, this);
        this.model.on('change:_center_row', this.update_view, this);
        this.model.on('change:_view_height', this.update_view, this);
        this.model.on('change:_view_rows', this.update_view, this);
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

        return footer;
    }

    set_range(view: JQuery<HTMLElement>): void {
        const body = view.find('.pd-table > tbody');
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

    update_data(): void {
        console.log('---------- update_data ----------');

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

        $.when(view).then(() => {
            // handle events
            view.on('scroll', (e: JQuery.ScrollEvent) => {
                const target = $(e.target);

                // vertical or horizontal scrolling
                if (this.on_scroll(target)) {
                    this.send_message();
                }
            }).on('click', (e: JQuery.ClickEvent) => {
                const target = $(e.target);
                const classes = (target.attr('class') || '').split(/\s+/);

                // resize handler clicked
                if (classes.includes('pd-view')) {
                    if (this.on_resize(target)) {
                        this.send_message();
                    }
                }

                // column header clicked
                if (classes.includes('pd-col-head')) {
                    if (this.on_sort(target)) {
                        this.send_message();
                    }
                }

                // row index clicked
                if (classes.includes('pd-row-head')) {
                    if (this.on_select(target)) {
                        this.send_message();
                    }
                }
            });

            // set viewport range
            this.set_range(view);

            // set viewport height
            this.set_height(view);

            // update viewport
            this.update_view();
        });
    }

    update_table(): void {
        console.log('---------- update_table ----------');

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
        console.log('---------- update_view ----------');

        const view = $(this.el).children('.pd-view');

        // set scroll position
        view.scrollTop(this.model.get('_scroll_top'));
        view.scrollLeft(this.model.get('_scroll_left'));

        // set height
        view.height(this.model.get('_view_height'));
    }

    send_message(): void {
        const model = {
            start_rows: this.model.get('start_rows'),
            end_rows: this.model.get('end_rows'),
            state_rows: JSON.parse(this.model.get('state_rows')),
            state_cols: JSON.parse(this.model.get('state_cols')),
        };

        console.log('---------- send_message ----------', model);

        // send model to backend
        this.send({
            model: model,
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
