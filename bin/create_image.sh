#!/bin/sh

# スクリプトの実行場所を固定
cd $(cd $(dirname $0)/..; pwd)

cd ecr/go/
docker build -t bombman_app .
cd ../mysql
docker build -t mysql57_29 .
