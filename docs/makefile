# Copyright (c) Tensorware.
# Makefile for Sphinx documentation.

# you can set these variables from the command line
BUILDDIR      = build
SOURCEDIR     = source
SPHINXPROJ    = ipypandas
SPHINXBUILD   = sphinx-build
SPHINXOPTS    =

# put it first so that "make" without argument is like "make help"
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help makefile

# route all unknown targets to sphinx using the "make mode" option
%: makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
