#!/bin/bash
# Licensed to Cloudera, Inc. under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  Cloudera, Inc. licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e
set -x

BINDIR=$(dirname $0)

desktop_root=$PWD

export REPO_TRACE=1

. $BINDIR/build-functions

##############################
# Build prod tarball
##############################
git clean -xdf
rm -rf ext
git reset --hard HEAD

build_hadoop

make prod

##############################
# Build Hue from within SDK dir
##############################
cd build/release/prod/
cd $(ls -d hue-* | grep -v tgz)

make apps

##############################
# Smoke tests
##############################
./build/env/bin/desktop depender_check
./build/env/bin/desktop config_help

##############################
# Install
##############################
INSTALL_DIR=$(pwd)/../installdir make install

##############################
# Check install
##############################
cd ../installdir
./build/env/bin/desktop depender_check
./build/env/bin/desktop config_help
