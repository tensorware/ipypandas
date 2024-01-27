
Development Installation
=====================================

To install a developer version of ipypandas, you will first need to clone
the repository::

    git clone https://github.com/tensorware/ipypandas
    cd ipypandas

Next, install it with a develop install using pip::

    pip install -e .


If you are planning on working on the JS/frontend code, you should also do
a link installation of the extension::

    jupyter labextension develop --overwrite .


.. links

.. _`appropriate flag`: https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html#installing-and-enabling-extensions
