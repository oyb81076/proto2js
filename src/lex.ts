/**
 * 词法分析器
 */
import * as fs from 'fs'
export enum TokenType {
    // 文件结束
    EOF = 0,
    // 变量类型
    ID = 6,
    // 字符串类型
    STRING = 1,
    // 符号类型 [={}]
    SYMBOL = 2,
    // 数字
    INT = 3,
    // 单行后缀注解
    INLINE_COMMENT = 4,
    // 前缀注解 /** */ 一定是前缀注解
    // //aaaa 也是前缀注解, // 位于行首, 就是前缀注解了
    // var a = 3 // 这个才叫做后缀注解
    HEAD_COMMENT = 5
}
const { EOF, ID, STRING, SYMBOL, INT, INLINE_COMMENT, HEAD_COMMENT } = TokenType
let content = ''
let indexLt = 0
let index = 0
export class Token {
    index = index
    createError(message?: string) { return createError(this.index, message) }
    constructor(public type: TokenType, public str: string) { }
}
const createError = (index: number, message?: string) => {
    let i = index
    let str = ''
    while (i >= 0 && content[--i] !== '\n');
    while (i < indexLt && content[++i] !== '\n') str += content[i]
    if (message) return message + '\nerror near ' + index + ' ' + str
    return `error near ${index} ` + str
}
export const nextToken = function (): Token {
    while (index < indexLt + 1 && /[ \t\n;]/.test(content[index])) index++
    let str = content[index]
    if (!str) {
        return new Token(EOF, '')
    } else if (/[a-zA-Z.]/.test(str)) {
        while (index < indexLt && /[a-zA-Z0-9._]/.test(content[++index]))
            str += content[index]
        return new Token(ID, str)
    } else if (/[0-9]/.test(str)) {
        while (index < indexLt && /[0-9]/.test(content[++index]))
            str += content[index]
        return new Token(INT, str)
    } else if (/[{}=]/.test(content[index])) {//分隔符
        index++
        return new Token(SYMBOL, str)
    } else if (str === '/') {//注解的指针
        switch (content[++index]) {
            case '/':
                let k = index - 1
                let type = HEAD_COMMENT
                while (k > 0 && content[--k] !== '\n') {
                    if (content[k] !== ' ' && content[k] !== '\t') {
                        type = INLINE_COMMENT
                    }
                }
                // 去掉空串
                while (index < indexLt && /[\n\t\/ ]/.test(str = content[++index]));
                // 如果是空注解 ////
                if (str === '\n') {
                    return nextToken()
                } else {
                    while (index < indexLt && content[++index] !== '\n') str += content[index]
                    return new Token(type, str)
                }
            case '*':
                //去掉空串
                while (index < indexLt && /[\n\t *]/.test(str = content[++index]));
                // 如果是空注解 /** */
                if (content[index - 1] === '*' && content[index] === '/') {
                    index++
                    return nextToken()
                } else {
                    while (index < indexLt) {
                        while (index < indexLt && content[++index] !== '\n') {
                            while (index < indexLt && /[*\t ]/.test(content[index])) index++
                            if (content[index - 1] === '*' && content[index] === '/') {
                                index++
                                str = str.trim()
                                return new Token(HEAD_COMMENT, str )
                            } else if (content[index] === '*' && content[index + 1] !== '/') {
                                index += 2
                                str = str.trim()
                                return new Token(HEAD_COMMENT, str)
                            }
                            str += content[index]
                        }
                        str += '\n'
                    }
                    throw new Error(createError(index))
                }
            default: throw new Error(createError(index))
        }
    } else if (str === '"') {
        str = ''
        while (index < indexLt && /[^"]/.test(content[++index])) str += content[index]
        index++
        return new Token(STRING, str)
    }
    throw new Error("char for " + str + " not token \n" + createError(index))
}

export function* tokens(path: string) {
    content = fs.readFileSync(path, { encoding: 'utf8' })
    indexLt = content.length - 1
    index = 0
    let token: Token
    while ((token = nextToken()).type !== EOF) {
        yield token
    }
    yield token
}
