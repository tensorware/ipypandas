# ipypandas

[![Build](https://github.com/tensorware/ipypandas/actions/workflows/build.yml/badge.svg)](https://github.com/tensorware/ipypandas/actions/workflows/build.yml)
[![Release](https://github.com/tensorware/ipypandas/actions/workflows/release.yml/badge.svg)](https://github.com/tensorware/ipypandas/actions/workflows/release.yml)
[![NPM](https://img.shields.io/npm/v/ipypandas?label=NPM%20Package)](https://www.npmjs.com/package/ipypandas)
[![PyPI](https://img.shields.io/pypi/v/ipypandas?label=PyPI%20Package)](https://pypi.org/project/ipypandas)

<a href="https://github.com/tensorware/ipypandas">
    <img src="https://raw.githubusercontent.com/tensorware/ipypandas/main/docs/source/static/images/logo.png" width="100"/>
</a>

> [!NOTE]
> ❗ PROOF OF CONCEPT, WORK IN PROGRESS ❗

Interactive features for the python data analysis library pandas in jupyter.

[![demo](https://raw.githubusercontent.com/tensorware/ipypandas/main/docs/source/static/images/demo.gif)](https://raw.githubusercontent.com/tensorware/ipypandas/main/docs/source/static/images/demo.gif)

Pandas dataframes are rendered via ipypandas, which enables these interactive features (**fully server side**):

-   [x] Lazy loading
-   [x] Sort columns
-   [x] Resize columns
-   [x] Reorder columns
-   [x] Search values
-   [ ] Filter values

The rendering has been tested for the following development environments (**full theme support**):

-   [x] JupyterLab
-   [x] JupyterNotebook
-   [x] Visual Studio Code
-   [ ] PyCharm Professional

## Installation

To get started with ipypandas, install it via `pip`:

```bash
pip install ipypandas
```

## Usage

Importing ipypandas will enable the interactive pandas output globally:

```python
import pandas as pd
...
import ipypandas
```

## Development

Create a dev environment:

```bash
mamba create -n ipypandas python=3.12 jupyterlab=4.0 nodejs=20.5
mamba activate ipypandas
```

Install python module and build typescript dependencies:

```bash
pip install -e .[dev]
```

While developing you need to manually enable your extensions with the frontend. For JupyterLab, this is done by the command:

```bash
jupyter labextension develop --overwrite .
```

### Typescript

If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
jlpm clean && jlpm install && jlpm build && jlpm watch
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

### Python

If you make changes to the python code then you will need to restart the notebook kernel to have it take effect.

### Commands

Some commands which may be useful for development.

#### Install

```bash
jlpm clean && jlpm install && jlpm build
pip uninstall ipypandas && pip install -e .[dev]
```

#### Register

```bash
jupyter lab clean
jupyter labextension list
jupyter labextension develop --overwrite .
```

#### Examples

```bash
jupyter lab ./examples
```

#### Documentation

```bash
cd docs
make html
```

#### Versioning

```bash
pip install tbump
tbump <new-version>
```

## Credits

Based on the [cookiecutter template](https://github.com/jupyter-widgets/widget-ts-cookiecutter) from [jupyter-widgets](https://github.com/jupyter-widgets).

## License [![license](https://img.shields.io/github/license/tensorware/ipypandas)](#license-)

[BSD-3-Clause](https://github.com/tensorware/ipypandas/blob/main/LICENSE)
