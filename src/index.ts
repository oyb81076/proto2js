import * as path from 'path'
import { Proto } from "./yacc";
import { tokens } from "./lex";
import { write } from './write'
import * as fs from 'fs'
/** */
export const run = (filenames: string[], output: string) => {
    const array: Proto[] = []
    const fullEnums = new Set<string>()
    const stream = fs.createWriteStream(path.join(output))
    for (let filename of filenames) {
        const proto = new Proto(tokens(filename))
        proto.compile()
        proto.enums.forEach(x => { fullEnums.add("proto." + proto.package + "." + x) })
        array.push(proto)
    }
    for (const proto of array) {
        write(stream, proto, fullEnums)
    }
    stream.close()
}