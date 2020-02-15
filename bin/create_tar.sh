#!/bin/sh

# スクリプトの実行場所を固定
cd $(cd $(dirname $0)/..; pwd)

rm -f src/logs/*
cd src
tar zcvf ../ecr/go/app.tar.gz *
