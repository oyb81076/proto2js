# 一个命令行proto打包工具
安装 npm i proto2js -g
## proto2js -h
  Usage: proto2js [options]

  根据.proto 生成 proto.d.ts proto.js

  Options:

    -V, --version          output the version number
    -i, --input [input]    输入的文件地址 (default: *.proto)
    -c, --cwd [cwd]        cwd地址 默认. (default: .)
    -o, --outdir [outdir]  文件导出地址 (default: ./dist)
    -p, --protoc           protoc命令地址, windows下面用来指向protoc.exe, 如果环境变量能找到的就无需指定
    -j, --js               是否生成proto.js
    -h, --help             output usage information
## example
proto2js --cwd test --out ./dist
这个命令会把 test目录下的*.proto文件打包生成 ./dist/proto.d.ts

proto2js --protoc --out .
这个命令会把当前目录下的*.proto文件通过protoc命令生成的js和google-protobuf库文件合并成proto.js文件
同时生成一份 proto.d.ts文件

## protoc 安装
查看 https://github.com/protocolbuffers/protobuf