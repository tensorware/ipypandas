# Copyright (c) Tensorware.
# Makefile for Sphinx documentation.

# You can set these variables from the command line.
BUILDDIR      = build
SOURCEDIR     = source
SPHINXPROJ    = ipypandas
SPHINXBUILD   = sphinx-build
SPHINXOPTS    =

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help makefile

# Route all unknown targets to Sphinx using the new "make mode" option.
%: makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
