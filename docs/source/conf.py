#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import os
import sys

from datetime import datetime

docs = os.path.dirname(os.path.dirname(__file__))
root = os.path.dirname(docs)

sys.path.insert(0, os.path.join(docs, 'sphinxext'))
sys.path.insert(0, root)

from ipypandas.version import package


# project information
pkg = package()
project = pkg['name']
version = pkg['version']
release = f'v{pkg["version"]}'
author = pkg['author']['name']
repository = pkg['repository']['url']
pypi = f'https://pypi.org/project/{project}'
npm = f'https://www.npmjs.com/package/{project}'
copyright = f'{datetime.now().year}, {author}'

# set theme properties
html_theme = 'pydata_sphinx_theme'
html_theme_options = {
    'logo': {
        'text': f'{project} {release}'
    },
    'navbar_start': ['navbar-logo'],
    'navbar_center': ['navbar-nav'],
    'navbar_persistent': ['search-button'],
    'navbar_end': ['navbar-icon-links', 'theme-switcher'],
    'secondary_sidebar_items': ['page-toc'],
    'icon_links': [
        { 'name': 'NPM', 'url': npm, 'icon': 'fa-brands fa-node-js', 'type': 'fontawesome' },
        { 'name': 'PyPI', 'url': pypi, 'icon': 'fa-brands fa-python', 'type': 'fontawesome' },
        { 'name': 'GitHub', 'url': repository, 'icon': 'fa-brands fa-github', 'type': 'fontawesome' }
    ],
    'footer_start': [],
    'footer_center': [],
    'footer_end': ['copyright'],
    'navigation_with_keys': False
}
html_context = {
    'default_mode': 'light'
}
html_sidebars = { '**': [] }

# set static file paths
html_static_path = ['static']
html_css_files = ['styles/theme.css']
html_logo = 'static/images/logo.png'

# allow errors on test runs
nbsphinx_allow_errors = True

# add sphinx extension modules
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.todo',
    'jupyter_sphinx',
    'nbsphinx_link',
    'nbsphinx'
]

# add setup scripts
def setup(app):
    def add_scripts(app):
        for file in ['embed.js']:
            app.add_js_file(file)
    app.connect('builder-inited', add_scripts)
