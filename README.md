# 一个命令行proto打包工具, 可生成 proto.d.ts 以及 proto.js
安装 npm i proto2js -g

## 说明
`` proto2js --help ``

  Usage: proto2js [options]

  根据.proto 生成 proto.d.ts proto.js

  Options:

    -V, --version          output the version number
    -s, --src [src]        proto文件地址 (default: *.proto)
    -c, --cwd [cwd]        proto文件所在目录地址 默认 . (default: .)
    -o, --outdir [outdir]  文件导出地址 (default: ./dist)
    -p, --protoc [protoc]  protoc命令地址, windows下面用来指向protoc.exe, 如果环境变量中有就不用改了 (default: protoc)
    -j, --js               是否生成proto.js
    -h, --help             output usage information

## Exmaple0
room.proto
```
/**
 * Room
 */
syntax = "proto3";
package room;
import "user.proto";
/** RoomType */
enum RoomType {
    ROOM_TYPE_NONE = 0;
    ROOM_TYPE_1 = 1;
}
/** Room */
message Room {
    // ID
    string id = 1;
    // User
    repeated .user.User user = 2;
}
```
user.proto
```
syntax = "proto3";
package user;

message User {
    string id = 1;
}
```
执行 ``proto2js --outdir .`` 会在当前目录下生成一个文件proto.d.ts
```
/**
 * Generate Head
 * 
 * Room
 * syntax = "proto3";
 * package room;
 * import "user.proto";
 */
declare namespace proto.room {

    /**
     * RoomType
     */
    enum RoomType {
        ROOM_TYPE_NONE = 0,
        ROOM_TYPE_1 = 1,
    }


    /**
     * Room
     */
    interface IRoom {

        /**
         * ID
         */
        id: string

        /**
         * User
         */
        userList: proto.user.IUser[]
    }


    /**
     * Room
     */
    class Room {

        /**
         * ID
         */
        public setId(v: string): void

        /**
         * ID
         */
        public getId(): string

        /**
         * User
         */
        public setUserList(v: proto.user.User[]): void

        /**
         * User
         */
        public getUserList(): proto.user.User[]
        public clearUserList(): void
        public addUser(v: proto.user.User, index: number): void
        public toObject(): IRoom
        public serializeBinary(): Uint8Array
        public static deserializeBinary(buffer: Uint8Array): Room
    }

}

/**
 * Generate Head
 * 
 * syntax = "proto3";
 * package user;
 */
declare namespace proto.user {
    interface IUser {
        id: string
    }

    class User {
        public setId(v: string): void
        public getId(): string
        public toObject(): IUser
        public serializeBinary(): Uint8Array
        public static deserializeBinary(buffer: Uint8Array): User
    }

}
```

## example1
``proto2js --cwd test --out ./dist``
> 这个命令会把 test目录下的*.proto文件打包生成 ./dist/proto.d.ts
## example2
``proto2js --js --out .`` 
> 这个命令会把当前目录下的*.proto文件通过protoc命令生成的js和google-protobuf库文件合并成proto.js文件
> 同时生成一份 proto.d.ts文件

## protoc 安装
查看 https://github.com/protocolbuffers/protobuf