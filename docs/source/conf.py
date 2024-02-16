#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Tensorware.
# Distributed under the terms of the Modified BSD License.

import os
import sys

from os.path import dirname, join as pjoin


# add sphinx extension module names
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx.ext.intersphinx',
    'sphinx.ext.napoleon',
    'sphinx.ext.todo',
    'jupyter_sphinx',
    'nbsphinx_link',
    'nbsphinx'
]
docs = dirname(dirname(__file__))
root = dirname(docs)

sys.path.insert(0, root)
sys.path.insert(0, pjoin(docs, 'sphinxext'))

# general information about the project
project = 'ipypandas'
author = 'Tensorware'
copyright = '2024, Tensorware'
htmlhelp_basename = 'ipypandasdoc'

# get version from python package
version_py = dict()
with open(os.path.join(root, 'ipypandas', 'version.py')) as f:
    exec(f.read(), version_py)
version = version_py['__version__']
release = version_py['__version__']

# add any paths that contain templates relative to this directory
templates_path = ['static/templates']

# the suffixes of source filenames
source_suffix = ['.rst', '.md']

# the master toctree document
master_doc = 'index'

# the name of the pygments (syntax highlighting) style
pygments_style = 'sphinx'

# the patterns to ignore when looking for source files
exclude_patterns = ['**.ipynb_checkpoints']

# options for manual page (source start file, name, description, authors, manual section)
man_pages = [(
    master_doc,
    'ipypandas',
    'ipypandas Documentation',
    [author],
    1
)]

# grouping the latex document tree (source start file, target name, title, author, document class)
latex_documents = [(
    master_doc,
    'ipypandas.tex',
    'ipypandas Documentation',
    'Tensorware',
    'manual'
)]

# grouping the texinfo document tree (source start file, target name, title, author, dir menu entry, description, category)
texinfo_documents = [(
    master_doc,
    'ipypandas',
    'ipypandas Documentation',
    author,
    'ipypandas',
    'Interactive JupyterLab features for the python data analysis library pandas.',
    'Miscellaneous'
)]

# set the nbsphinx js path to empty to avoid showing widgets twice
nbsphinx_allow_errors = True
nbsphinx_requirejs_path = ''
nbsphinx_widgets_path = ''

# only set the theme if we're building docs locally
if os.environ.get('READTHEDOCS', None) != 'True':
    html_theme = 'pydata_sphinx_theme'
    html_theme_options = { 'navigation_with_keys': True }
    html_sidebars = { '**': [] }

# set static file paths
html_static_path = ['static']
html_css_files = ['styles/theme.css']
html_logo = 'static/images/logo.png'


# setup scripts
def setup(app):
    def add_scripts(app):
        for file in ['helper.js', 'embed.js']:
            app.add_js_file(file)
    app.connect('builder-inited', add_scripts)
