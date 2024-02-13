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

# get version from python package
version_ns = dict()
with open(os.path.join(root, 'ipypandas', 'version.py')) as f:
    exec(f.read(), version_ns)
version = '%i.%i' % version_ns['version_info'][:2]
release = version_ns['__version__']

# add any paths that contain templates relative to this directory
templates_path = ['templates']

# the suffixes of source filenames
source_suffix = ['.rst', '.md']

# the master toctree document
master_doc = 'index'

# the name of the pygments (syntax highlighting) style
pygments_style = 'sphinx'

# the patterns to ignore when looking for source files
exclude_patterns = ['**.ipynb_checkpoints']

# if true, `todo` and `todoList` produce output
todo_include_todos = False

# latex specific options
latex_elements = {
    # The paper size ('letterpaper' or 'a4paper').
    # 'papersize': 'letterpaper',

    # The font size ('10pt', '11pt' or '12pt').
    # 'pointsize': '10pt',

    # Additional stuff for the LaTeX preamble.
    # 'preamble': '',

    # Latex figure (float) alignment
    # 'figure_align': 'htbp'
}

# options for manual page (source start file, name, description, authors, manual section)
man_pages = [
    (
        master_doc,
        'ipypandas',
        'ipypandas Documentation',
        [author],
        1
    )
]

# grouping the latex document tree (source start file, target name, title, author, document class)
latex_documents = [
    (
        master_doc,
        'ipypandas.tex',
        'ipypandas Documentation',
        'Tensorware',
        'manual'
    )
]

# grouping the texinfo document tree (source start file, target name, title, author, dir menu entry, description, category)
texinfo_documents = [
    (
        master_doc,
        'ipypandas',
        'ipypandas Documentation',
        author,
        'ipypandas',
        'Interactive JupyterLab features for the python data analysis library pandas.',
        'Miscellaneous'
    )
]

# set the nbsphinx js path to empty to avoid showing widgets twice
nbsphinx_requirejs_path = ''
nbsphinx_widgets_path = ''

# only import and set the theme if we're building docs locally
on_rtd = os.environ.get('READTHEDOCS', None) == 'True'
if not on_rtd:
    html_theme = 'pydata_sphinx_theme'
    html_theme_options = { 'navigation_with_keys': True }
    html_sidebars = { '**': [] }

html_static_path = ['static']
html_css_files = ['styles/theme.css']
html_logo = 'static/images/logo.png'

htmlhelp_basename = 'ipypandasdoc'

def setup(app):
    def add_scripts(app):
        for file in ['helper.js', 'embed.js']:
            app.add_js_file(file)
    app.connect('builder-inited', add_scripts)
