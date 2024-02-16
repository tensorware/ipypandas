
Development
=====================================

To install a developer version of ipypandas, you will first need to clone
the repository::

    git clone https://github.com/tensorware/ipypandas
    cd ipypandas

Next, install it with a develop install using pip::

    pip install -e .[dev]


If you are planning on working on the frontend code, you should also do
a link installation of the extension::

    jupyter labextension develop --overwrite .
