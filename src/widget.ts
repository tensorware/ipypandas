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
            _height: 0,
        };
    }
}

export class PandasView extends DOMWidgetView {
    get_view(): JQuery<HTMLElement> {
        const view = $('<div/>').addClass('pd-view');

        // table
        view.html(this.model.get('view'));
        const table = view.children('.pd-table');

        // truncated content
        if (this.model.get('max_colwidth')) {
            table.addClass('pd-truncated');
        }

        // empty table
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

    get_model(): any {
        return {
            n_rows: this.model.get('n_rows'),
            n_cols: this.model.get('n_cols'),
            min_rows: this.model.get('min_rows'),
            max_rows: this.model.get('max_rows'),
            max_columns: this.model.get('max_columns'),
            max_colwidth: this.model.get('max_colwidth'),
            pos_rows: this.model.get('pos_rows'),
            pos_cols: this.model.get('pos_cols'),
            row: JSON.parse(this.model.get('row')),
            col: JSON.parse(this.model.get('col')),
            _scroll_top: this.model.get('_scroll_top'),
            _scroll_left: this.model.get('_scroll_left'),
            _height: this.model.get('_height'),
        };
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

    render(): void {
        const classes_root = ['jp-RenderedHTMLCommon', 'jp-RenderedHTML', 'jp-OutputArea-output', 'jp-mod-trusted', 'pd-ipypandas'];
        const classes_sort = ['pd-sort-desc', 'pd-sort-asc', ''];
        const classes_state = ['pd-state-selected', ''];
        this.el.classList.add(...classes_root);

        // initial view
        this.value_changed();
        this.scroll_changed();

        // register change events
        this.model.on('change:view', this.value_changed, this);

        this.model.on('change:n_rows', this.value_changed, this);
        this.model.on('change:n_cols', this.value_changed, this);

        this.model.on('change:min_rows', this.value_changed, this);
        this.model.on('change:max_rows', this.value_changed, this);
        this.model.on('change:max_columns', this.value_changed, this);
        this.model.on('change:max_colwidth', this.value_changed, this);

        this.model.on('change:pos_rows', this.value_changed, this);
        this.model.on('change:pos_cols', this.value_changed, this);

        this.model.on('change:col', this.value_changed, this);
        this.model.on('change:row', this.value_changed, this);

        this.model.on('change:_scroll_top', this.scroll_changed, this);
        this.model.on('change:_scroll_left', this.scroll_changed, this);

        this.model.on('change:_height', this.height_changed, this);

        // register click events
        $(this.el).on('click', (e: JQuery.ClickEvent) => {
            const target = $(e.target);
            const id = target.attr('id') || '';

            const classes = (target.attr('class') || '').split(/\s+/);
            const level = this.get_num(target, 'pd-lvl');

            const model = this.get_model();

            // save height
            const view = $(this.el).children('.pd-view');
            this.model.set('_height', view.height());

            // column clicked
            if (classes.includes('pd-col-head')) {
                this.rotate_class(target, classes_sort);

                const col = this.get_num(target, 'pd-col');
                const sort = this.get_str(target, 'pd-sort');

                if (sort) {
                    model['col'][id] = {
                        index: col,
                        level: level,
                        sort: sort,
                    };
                } else {
                    delete model['col'][id];
                }

                this.model.set('col', JSON.stringify(model.col));
            }

            // row clicked
            if (classes.includes('pd-row-head')) {
                this.rotate_class(target, classes_state);

                const row = this.get_num(target, 'pd-row');
                const state = this.get_str(target, 'pd-state');

                if (state) {
                    model['row'][id] = {
                        index: row,
                        level: level,
                        state: state,
                    };
                } else {
                    delete model['row'][id];
                }

                this.model.set('row', JSON.stringify(model.row));
            }
        });
    }

    value_changed(): void {
        // get model
        const model = this.get_model();
        const root = $(this.el).empty();

        // update view (rendered view html from pandas)
        const view = this.get_view();
        root.append(view);

        // update footer
        const footer = this.get_footer();
        root.append(footer);

        // set scroll position
        view.scrollTop(model._scroll_top);
        view.scrollLeft(model._scroll_left);

        // set height
        view.height(model._height);

        // set action classes
        Object.entries(model.col).forEach(([key, value]: [string, any]) => {
            const target = $(`#${key}`);
            if (value.sort) {
                target.addClass(`pd-sort-${value.sort}`);
            }
        });
        Object.entries(model.row).forEach(([key, value]: [string, any]) => {
            const target = $(`#${key}`);
            if (value.state) {
                target.addClass(`pd-state-${value.state}`);
            }
        });

        $.when(view).then((view: JQuery<HTMLElement>) => {
            // get dimensions
            const table = view.children('.pd-table');
            const head = table.children('thead');
            const body = table.children('tbody');

            const headerHeight = head.outerHeight() || 0;
            const rowHeight = body.children('tr:first').outerHeight() || 0;

            // handle scroll events (scroll is not delegated and therefore can't be registered on the parent element)
            view.on('scroll', (e: JQuery.ScrollEvent) => {
                const target = $(e.target);

                // set scroll
                const currentScrollTop = target.scrollTop() || 0;
                const targetScrollTop = this.round_to(currentScrollTop, rowHeight);
                const currentScrollLeft = target.scrollLeft() || 0;
                const targetScrollLeft = currentScrollLeft || 0;

                this.model.set('_scroll_top', targetScrollTop);
                this.model.set('_scroll_left', targetScrollLeft);

                // set position
                const centerDelta = this.model.get('min_rows') / 2;
                const centerPos = targetScrollTop / rowHeight + centerDelta;
                if (Math.abs(centerPos - this.model.get('pos_rows')) >= centerDelta) {
                    //this.model.set('pos_rows', this.round_to(centerPos, centerDelta));
                    this.model.set('pos_rows', centerPos);
                }
                console.log(centerPos, rowHeight, currentScrollTop);
            });

            const start = Math.max(0, model.pos_rows - model.min_rows);
            const end = Math.min(model.n_rows, model.pos_rows + model.min_rows);

            // set viewport margin
            const marginTop = start * rowHeight;
            const marginBottom = (model.n_rows - end) * rowHeight;

            body.css({
                '--pd-body-padding-top': marginTop + 'px',
                '--pd-body-padding-bottom': marginBottom + 'px',
                '--pd-body-td-max-width': model.max_colwidth + 'ch',
            });
            console.log(this.model.get('pos_rows'), start, end, marginTop, marginBottom, marginTop + marginBottom + (end - start) * rowHeight);

            // set scroll position
            view.scrollTop(model._scroll_top);
            view.scrollLeft(model._scroll_left);

            // set initial height
            let maxHeight = table.outerHeight() || 0;
            let minHeight = Math.min(maxHeight, headerHeight + model.min_rows * rowHeight);
            view.css({
                '--pd-view-min-height': minHeight + 'px',
                '--pd-view-max-height': maxHeight + 'px',
            });

            // increase height in case horizontal scrollbars exists
            const scrollBarHeight = view[0].offsetHeight - view[0].clientHeight;
            maxHeight += scrollBarHeight;
            minHeight += scrollBarHeight;
            view.css({
                '--pd-view-min-height': minHeight + 'px',
                '--pd-view-max-height': maxHeight + 'px',
            });

            // set height
            if (!this.model.get('_height')) {
                if (!model.max_rows || model.n_rows <= model.max_rows) {
                    this.model.set('_height', maxHeight);
                } else {
                    this.model.set('_height', minHeight);
                }
            }

            //console.log('---------- send ----------', this.get_model());

            // send to backend
            this.send({ model: this.get_model() });
        });
    }

    scroll_changed(): void {
        // get view
        const view = $(this.el).children('.pd-view');

        // wait and use value from last event
        setTimeout(() => {
            view.scrollTop(this.model.get('_scroll_top'));
            view.scrollLeft(this.model.get('_scroll_left'));
        }, 100);
    }

    height_changed(): void {
        // get view
        const view = $(this.el).children('.pd-view');

        // set height
        view.height(this.model.get('_height'));
    }
}
