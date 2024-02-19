
ipypandas
=====================================

**Version**: |release|, **Date**: |today|

.. note::

    ❗ PROOF OF CONCEPT, WORK IN PROGRESS ❗

Interactive JupyterLab features for the python data analysis library pandas.

.. image:: _static/images/demo.gif
    :align: center
    :width: 900px
|
Pandas dataframes are rendered via ipypandas, which enables these interactive features (**fully server side**):

- |x| Lazy loading
- |x| Sort columns
- |x| Resize columns
- |x| Reorder columns
- |x| Search values
- |_| Filter values

The rendering has been tested for the following development environments (**full theme support**):

- |x| JupyterLab
- |x| JupyterNotebook
- |x| Visual Studio Code
- |_| PyCharm Professional


Contents
--------

.. toctree::
   :maxdepth: 3
   :caption: Installation

   installation/installation

.. toctree::
   :maxdepth: 3
   :caption: Examples

   examples/examples

.. toctree::
   :maxdepth: 3
   :caption: Development

   development/development


.. |x| raw:: html

    <input checked="" disabled="" type="checkbox">

.. |_| raw:: html

    <input disabled="" type="checkbox">
