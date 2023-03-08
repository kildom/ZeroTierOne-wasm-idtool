#!/bin/bash

TOOLS=`pwd`/tools

mkdir -p $TOOLS
pushd $TOOLS
[ -e wasi-sdk-19.0-linux.tar.gz ] || wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-19/wasi-sdk-19.0-linux.tar.gz
[ -e wasi-sdk-19.0 ] || tar -xzf wasi-sdk-19.0-linux.tar.gz
[ -e binaryen-version_112-x86_64-linux.tar.gz ] || wget https://github.com/WebAssembly/binaryen/releases/download/version_112/binaryen-version_112-x86_64-linux.tar.gz
[ -e binaryen-version_112 ] || tar -xzf binaryen-version_112-x86_64-linux.tar.gz
popd

export CC=$TOOLS/wasi-sdk-19.0/bin/clang
export CXX=$TOOLS/wasi-sdk-19.0/bin/clang++
export CXXFLAGS="--sysroot=$TOOLS/wasi-sdk-19.0/share/wasi-sysroot/ -mno-atomics -mbulk-memory -Oz"
export CCFLAGS="$CXXFLAGS"
export LDFLAGS="$CXXFLAGS -mexec-model=reactor"
export WASM_OPT="$TOOLS/binaryen-version_112/bin/wasm-opt -Oz -s 100000"

make -j`nproc` $@
