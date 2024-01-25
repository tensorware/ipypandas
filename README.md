
# ipypandas
[![Build Status](https://travis-ci.org/tensorware/ipypandas.svg?branch=master)](https://travis-ci.org/tensorware/ipypandas)
[![codecov](https://codecov.io/gh/tensorware/ipypandas/branch/master/graph/badge.svg)](https://codecov.io/gh/tensorware/ipypandas)

Interactive JupyterLab features for the python data analysis library pandas.

## Installation
You can install using `pip`:
```bash
pip install ipypandas
```

## Development Installation
Create a dev environment:
```bash
mamba create -n ipypandas python=3.10 jupyterlab=4.0 yarn=4.0 nodejs=20.5
mamba activate ipypandas
```

Install npm packages.
```bash
yarn install
```

Install the python module and build TS dependencies.
```bash
pip install -e ".[examples, tests, docs]"
```

When developing your extensions, you need to manually enable your extensions with the frontend. For JupyterLab, this is done by the command:
```bash
jupyter labextension develop --overwrite .
```

### Commands

#### Install
```bash
yarn clean && yarn install && yarn build
pip uninstall ipypandas && pip install -e ".[examples, tests, docs]"
```

#### Extension
```bash
jupyter lab clean
jupyter labextension list
jupyter labextension develop --overwrite .
jupyter lab ./examples
```

#### Documentation
```bash
cd docs
make html
```

### Typescript
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.
```bash
# watch the source directory and automatically rebuilding when needed
yarn clean && yarn install && yarn build && yarn watch

# run JupyterLab in another terminal (use ipypandas environment)
jupyter lab ./examples --no-browser
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

### Python
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.

### Versioning
To update the version, install tbump and use it to bump the version.
By default it will also create a tag.
```bash
pip install tbump
tbump <new-version>
```

## Credits
Template from `https://github.com/jupyter-widgets/widget-ts-cookiecutter`.
