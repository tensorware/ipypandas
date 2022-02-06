#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os

from glob import glob
from os.path import join as pjoin
from setuptools import setup, find_packages

from jupyter_packaging import (
    create_cmdclass,
    install_npm,
    ensure_targets,
    combine_commands,
    get_version,
    skip_if_exists
)

ROOT = os.path.dirname(os.path.abspath(__file__))

name = 'ipypandas'
version = get_version(pjoin(name, '_version.py'))

package_data_spec = {
    name: [
        'nbextension/**js*',
        'labextension/**'
    ]
}

data_files_spec = [
    ('share/jupyter/nbextensions/ipypandas', 'ipypandas/nbextension', '**'),
    ('share/jupyter/labextensions/ipypandas', 'ipypandas/labextension', '**'),
    ('share/jupyter/labextensions/ipypandas', '.', 'install.json'),
    ('etc/jupyter/nbconfig/notebook.d', '.', 'ipypandas.json')
]

jstargets = [
    pjoin(ROOT, name, 'nbextension', 'index.js'),
    pjoin(ROOT, name, 'labextension', 'package.json')
]

cmdclass = create_cmdclass('jsdeps', package_data_spec=package_data_spec, data_files_spec=data_files_spec)
npm_install = combine_commands(install_npm(ROOT, build_cmd='build:prod'), ensure_targets(jstargets))
cmdclass['jsdeps'] = skip_if_exists(jstargets, npm_install)

setup_args = dict(
    name=name,
    description='Interactive Jupyter Notebook and JupyterLab features for the python data analysis library pandas',
    version=version,
    scripts=glob(pjoin('scripts', '*')),
    cmdclass=cmdclass,
    packages=find_packages(),
    author='Tensorware',
    author_email='support@tensorware.net',
    url='https://github.com/tensorware/ipypandas',
    license='BSD',
    platforms="Linux, Mac OS X, Windows",
    keywords=['Jupyter', 'Widgets', 'IPython'],
    classifiers=[
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Framework :: Jupyter'
    ],
    include_package_data=True,
    python_requires=">=3.6",
    install_requires=[
        'ipywidgets>=7.0.0',
        'pandas>=1.3.0'
    ],
    extras_require={
        'test': [
            'pytest>=4.6',
            'pytest-cov',
            'nbval'
        ],
        'examples': [
            'ipywidgets>=7.0.0',
            'pandas>=1.3.0'
        ],
        'docs': [
            'sphinx>=1.5',
            'sphinx_rtd_theme',
            'jupyter_sphinx',
            'nbsphinx',
            'nbsphinx-link',
            'pypandoc',
            'recommonmark',
            'pytest_check_links'
        ]
    },
    entry_points={}
)

if __name__ == '__main__':
    setup(**setup_args)
