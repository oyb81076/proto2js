import { Proto } from "./yacc";
import { tokens } from "./lex";
import { write } from './write'
/** */
export const run = (filenames: string[], stream: NodeJS.WritableStream) => {
    const array: Proto[] = []
    const fullEnums = new Set<string>()
    for (let filename of filenames) {
        const proto = new Proto(tokens(filename))
        proto.compile()
        proto.enums.forEach(x => { fullEnums.add("proto." + proto.package + "." + x) })
        array.push(proto)
    }
    for (const proto of array) {
        write(stream, proto, fullEnums)
    }
}