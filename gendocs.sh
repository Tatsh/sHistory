#!/bin/sh
DOCDIR="/home/tatsh/dev/sHistory-doc"
jsdoc -c=./jsdoc.conf
cd DOCDIR
git add .
git commit -m "Generated documentation"
git push -u origin gh-pages
