#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

from .widget import PandasWidget, formatter, enable, disable
from .version import module_version, module_semver, module_name


# called by jupyter lab to detect labextension and to install the widget
def _jupyter_labextension_paths():
    return [{
        'src': 'labextension',
        'dest': module_name
    }]


# called by jupyter notebook to detect nbextension and to install the widget
def _jupyter_nbextension_paths():
    return [{
        'src': 'nbextension',
        'dest': module_name,
        'section': 'notebook',
        'require': f'{module_name}/extension'
    }]


# enable formatter on package import
__version__ = module_version
if formatter() is not None:
    enable()
