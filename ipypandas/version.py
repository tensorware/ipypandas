#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import os
import json

from collections import defaultdict


def package():
    path = os.path.join(os.path.dirname(__file__), 'labextension', 'package.json')
    if os.path.exists(path):
        return json.load(open(path))
    return defaultdict(str)

pkg = package()

module_name = pkg['name']
module_semver = f'^{pkg['version']}'
module_version = pkg['version']
