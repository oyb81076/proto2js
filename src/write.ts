/**
 * 打印
 */
import { Proto, Syntax, Package, Import, Message, Enum, Comment, MessageProp } from './yacc';
const indent1 = '    '
const indent2 = indent1 + indent1
const getPropName = ({ repeated, name }: MessageProp, iFace: boolean) => {
    return name.toLowerCase().split("_").map((x, index) => {
        if (iFace && index === 0) return x
        return x[0].toUpperCase() + x.slice(1)
    }).join("") + (repeated ? "List" : "")
}
const getTypeName = ({ type, repeated }: MessageProp, iFace: boolean, enums: Set<string>, fullEnums: Set<string>) => {
    switch (type) {
        case 'float':
        case 'double':
        case 'int32':
        case 'int64': 
        case 'uin32':
        case 'uint64':
        case 'sint32':
        case 'sing64':
        case 'fixed32':
        case 'fixed64':
        case 'sfixed32':
        case 'sfixed64':
            return repeated ? 'number[]' : 'number'
        case 'bool': return repeated ? 'boolean[]' : 'boolean'
        case 'string': return repeated ? 'string[]' : 'string'
        case 'bytes': return repeated ? 'Uint8Array[]' : 'Uint8Array'
    }
    if (type[0] === '.') {
        if (!iFace || fullEnums.has("proto" + type)) {
            return repeated ? "proto" + type + '[]' : "proto" + type
        } else {
            const sp = ("proto" + type).split('.')
            sp[sp.length - 1] = "I" + sp[sp.length - 1]
            return repeated ? sp.join('.') + '[]' : sp.join('.')
        }
    } else {
        if (!iFace || enums.has(type)) {
            return repeated ? type + '[]' : type
        } else {
            return repeated ? "I" + type + '[]' : 'I' + type
        }
    }
}
const writeComment = (out: NodeJS.WritableStream, { head, inline }: Comment, indent: string = '', wrap: boolean = true) => {
    if (!head.length && !inline.length) return
    if (wrap) out.write("\n" + indent + "/**\n")
    head.forEach(x => out.write(`${indent} * ${x}\n`))
    inline.forEach(x => out.write(`${indent} * // ${x}\n`))
    if (wrap) out.write(`${indent} */\n`)
}
const writeHead = (out: NodeJS.WritableStream, proto: Proto) => {
    out.write("/**\n")
    out.write(" * Generate Head\n * \n")
    for (let x of proto.children) {
        if (x instanceof Syntax) {
            writeComment(out, x.comment, '', false)
            out.write(` * syntax = "${x.value}";\n`)
        } else if (x instanceof Package) {
            writeComment(out, x.comment, '', false)
            out.write(` * package ${x.value};\n`)
        } else if (x instanceof Import) {
            writeComment(out, x.comment, '', false)
            out.write(` * import "${x.value}";\n`)
        }
    }
    out.write(" */\n")
}
const writeEnum = (out: NodeJS.WritableStream, x: Enum) => {
    writeComment(out, x.comment, indent1)
    out.write(`${indent1}enum ${x.name} {\n`)
    x.props.forEach(x => {
        writeComment(out, x.comment, indent2)
        out.write(`${indent2}${x.name} = ${x.value},\n`)
    })
    out.write(indent1 + '}\n\n')
}
const writeInterface = (out: NodeJS.WritableStream, x: Message, enums: Set<string>, fullEnums: Set<string>) => {
    writeComment(out, x.comment, indent1)
    out.write(`${indent1}interface I${x.name} {\n`)
    x.props.forEach(x => {
        const name = getPropName(x, true)
        const type = getTypeName(x, true, enums, fullEnums)
        writeComment(out, x.comment, indent2)
        out.write(`${indent2}${name}: ${type}\n`)
    })
    out.write(indent1)
    out.write('}\n\n')
}
const writeClass = (out: NodeJS.WritableStream, x: Message, enums: Set<string>, fullEnums: Set<string>) => {
    writeComment(out, x.comment, indent1)
    out.write(`${indent1}class ${x.name} {\n`)
    x.props.forEach(x => {
        const Name = getPropName(x, false)
        const type = getTypeName(x, false, enums, fullEnums)
        writeComment(out, x.comment, indent2)
        out.write(`${indent2}public set${Name}(v: ${type}): void\n`)
        writeComment(out, x.comment, indent2)
        out.write(`${indent2}public get${Name}(): ${type}\n`)
        if (x.repeated) {
            out.write(`${indent2}public clear${Name}(): void\n`)
            out.write(`${indent2}public add${Name.replace(/List$/, "")}(v: ${type.replace(/\[\]$/, "")}, index?: number): void\n`)
        }
    })
    out.write(`${indent2}public toObject(): I${x.name}\n`)
    out.write(`${indent2}public serializeBinary(): Uint8Array\n`)
    out.write(`${indent2}public static deserializeBinary(buffer: Uint8Array): ${x.name}\n`)
    out.write(indent1)
    out.write('}\n\n')
}
export const write = (out: NodeJS.WritableStream, proto: Proto, fullEnums: Set<string>) => {
    writeHead(out, proto)
    out.write(`declare namespace proto.${proto.package} {\n`)
    for (let x of proto.children) {
        if (x instanceof Message) {
            // interface
            writeInterface(out, x, proto.enums, fullEnums)
            writeClass(out, x, proto.enums, fullEnums)
        } else if (x instanceof Enum) {
            writeEnum(out, x)
        }
    }
    out.write("}\n\n")
}
