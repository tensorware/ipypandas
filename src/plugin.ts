// Copyright (c) Tensorware.
// Distributed under the terms of the Modified BSD License.

import { Widget } from '@lumino/widgets';
import { Application, IPlugin } from '@lumino/application';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import * as widgetExports from './widget';

const pandasPlugin: IPlugin<Application<Widget>, void> = {
    id: `${MODULE_NAME}:plugin`,
    requires: [IJupyterWidgetRegistry],
    activate: (app: Application<Widget>, registry: IJupyterWidgetRegistry): void => {
        registry.registerWidget({
            name: MODULE_NAME,
            version: MODULE_VERSION,
            exports: widgetExports,
        });
    },
    autoStart: true,
} as unknown as IPlugin<Application<Widget>, void>;

export default pandasPlugin;
