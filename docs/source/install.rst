
Installation
=====================================

The simplest way to install ipypandas is via pip::

    pip install ipypandas

Only if you are using Jupyter Notebook 5.2 or earlier, you will also have to
install / configure the front-end extension.
If you are using classic notebook (as opposed to Jupyterlab), run::

    jupyter nbextension install [--sys-prefix / --user / --system] --py ipypandas
    jupyter nbextension enable [--sys-prefix / --user / --system] --py ipypandas

with the `appropriate flag`_.
If you are using Jupyterlab, install the extension with::

    jupyter labextension install ipypandas

If you are installing using conda, these commands should be unnecessary, but If
you need to run them the commands should be the same (just make sure you choose the
`--sys-prefix` flag).


.. links

.. _`appropriate flag`: https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html#installing-and-enabling-extensions
