// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel, DOMWidgetView, ISerializers } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import '../css/widget.css';

/*
TODO
  - increase viewport range
  - fix row selector swapping
  - fix viewport resizing
  - fix lazy loading flickering
  - fix mouse scroll focus
  - move helper methods
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

        this.model.on('change:col', this.update_table, this);
        this.model.on('change:row', this.update_table, this);

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

    get_class(target: JQuery<HTMLElement>, match: string): string {
        // https://pandas.pydata.org/pandas-docs/stable/user_guide/style.html
        const classes = (target.attr('class') || '').split(/\s+/);
        const r = $.grep(classes, (x) => x.indexOf(match) === 0).join();
        return r.split('-').pop() || '';
    }

    get_num(target: JQuery<HTMLElement>, match: string): number {
        const c = this.get_class(target, match);
        return parseInt(c || '-1', 10);
    }

    get_str(target: JQuery<HTMLElement>, match: string): string {
        const c = this.get_class(target, match);
        return c || '';
    }

    rotate_class(target: JQuery<HTMLElement>, classes: string[]): string {
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

    round_to(number: number, multiple: number): number {
        return multiple * Math.round(number / multiple);
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
        const center_delta = Math.round(this.model.get('_view_rows') / 2);
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
        this.rotate_class(th, ['pd-sort-desc', 'pd-sort-asc', '']);

        console.log(th.css('--pd-df-iloc'));

        const index = this.get_num(th, 'pd-col');
        const level = this.get_num(th, 'pd-lvl');
        const sort = this.get_str(th, 'pd-sort');

        const col = JSON.parse(this.model.get('col'));
        const id = th.attr('id') || '';

        // update object
        if (sort) {
            col[id] = {
                index: index,
                level: level,
                sort: sort,
            };
        } else {
            delete col[id];
        }

        // set model col
        this.model.set('col', JSON.stringify(col));

        return true;
    }

    on_select(th: JQuery<HTMLElement>): boolean {
        this.rotate_class(th, ['pd-state-selected', '']);

        console.log(th.css('--pd-df-iloc'));

        const index = this.get_num(th, 'pd-row');
        const level = this.get_num(th, 'pd-lvl');
        const state = this.get_str(th, 'pd-state');

        const row = JSON.parse(this.model.get('row'));
        const id = th.attr('id') || '';

        // update object
        if (state) {
            row[id] = {
                index: index,
                level: level,
                state: state,
            };
        } else {
            delete row[id];
        }

        // set model row
        this.model.set('row', JSON.stringify(row));

        return true;
    }

    set_range(view: JQuery<HTMLElement>): void {
        const body = view.find('.pd-table > tbody');
        const row_height = body.find('tr:first').outerHeight() || 0;
        const lazy_load = this.model.get('max_rows') && this.model.get('n_rows') > this.model.get('max_rows');

        // init default values
        if (!this.model.get('_center_row')) {
            this.model.set('_center_row', Math.round(this.model.get('min_rows') / 2));
        }
        if (!this.model.get('_view_rows')) {
            this.model.set('_view_rows', this.model.get('min_rows'));
        }

        // calculate row ranges
        let start_rows = Math.max(0, this.model.get('_center_row') - this.model.get('_view_rows'));
        let end_rows = Math.min(this.model.get('n_rows'), this.model.get('_center_row') + this.model.get('_view_rows'));
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
                    this.send_data();
                }
            }).on('click', (e: JQuery.ClickEvent) => {
                const target = $(e.target);
                const classes = (target.attr('class') || '').split(/\s+/);

                // resize handler clicked
                if (classes.includes('pd-view')) {
                    if (this.on_resize(target)) {
                        this.send_data();
                    }
                }

                // column header clicked
                if (classes.includes('pd-col-head')) {
                    if (this.on_sort(target)) {
                        this.send_data();
                    }
                }

                // row index clicked
                if (classes.includes('pd-row-head')) {
                    if (this.on_select(target)) {
                        this.send_data();
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

        // set column classes
        Object.entries(JSON.parse(this.model.get('col'))).forEach(([key, value]: [string, any]) => {
            const column = $(`#${key}`);
            if (value.sort) {
                column.addClass(`pd-sort-${value.sort}`);
            }
        });

        // set row classes
        Object.entries(JSON.parse(this.model.get('row'))).forEach(([key, value]: [string, any]) => {
            const row = $(`#${key}`);
            if (value.state) {
                row.addClass(`pd-state-${value.state}`);
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

    send_data(): void {
        const model = {
            start_rows: this.model.get('start_rows'),
            end_rows: this.model.get('end_rows'),
            row: JSON.parse(this.model.get('row')),
            col: JSON.parse(this.model.get('col')),
        };

        console.log('---------- send ----------', model);

        // send model to backend
        this.send({
            model: model,
        });
    }
}
