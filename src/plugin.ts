// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { Widget } from '@lumino/widgets';
import { Application, IPlugin } from '@lumino/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { PandasModel, PandasView as PandasViewBase } from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';

const plugin: IPlugin<Application<Widget>, void> = {
    id: `${MODULE_NAME}:plugin`,
    requires: [IJupyterWidgetRegistry],
    optional: [IThemeManager],
    activate: (app: Application<Widget>, registry: IJupyterWidgetRegistry, manager: IThemeManager): void => {
        // extend view to listen for theme changes
        class PandasView extends PandasViewBase {
            render() {
                if (manager) {
                    manager.themeChanged.connect(this.reset_styles, this);
                }
                super.render();
            }
            remove() {
                if (manager) {
                    manager.themeChanged.disconnect(this.reset_styles, this);
                }
                super.remove();
            }
        }

        // register the widget extension
        registry.registerWidget({
            name: MODULE_NAME,
            version: MODULE_VERSION,
            exports: { PandasModel, PandasView }
        });
    },
    autoStart: true
} as IPlugin<Application<Widget>, void>;

export default plugin;
