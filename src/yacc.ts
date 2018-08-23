/**
 * 语法分析 + 结构生成
 */
import { Token, TokenType } from "./lex";
export class Comment {
    constructor(public head: string[], public inline: string[]) { }
}
class TokenFactory {
    private head: string[] = []
    private inline: string[] = []
    public done: boolean = false
    private it?: IterableIterator<Token>
    public value?: Token
    public take() {
        const head = this.head
        this.head = []
        return new Comment(head, this.inline = [])
    }
    public flushComment() {
        this.head = []
        this.inline = []
    }
    public init(it: IterableIterator<Token>) {
        this.it = it
        this.done = false
    }
    public next(): Token | void {
        const { it, done } = this
        if (done || !it) return
        let token: IteratorResult<Token> | undefined
        while (token = it.next()) {
            if (token.done) {
                this.done = true
                return
            }
            switch (token.value.type) {
                case TokenType.HEAD_COMMENT:
                    this.head.push(...token.value.str.split("\n"))
                    break
                case TokenType.INLINE_COMMENT:
                    this.inline.push(token.value.str)
                    break
                case TokenType.EOF:
                    this.done = true
                    return
                default:
                    return this.value = token.value
            }
        }
        this.done = true
    }
    public assertNext(typeOrStr: TokenType | string): Token {
        let value: Token | void
        while (value = this.next()) {
            if (!value) throw new Error("token null")
            if (typeof typeOrStr === 'string') {
                if (value.str !== typeOrStr) {
                    throw new Error("not assert string " + typeOrStr)
                }
                return value
            } else {
                if (value.type !== typeOrStr) {
                    throw new Error(value.createError(`not assert type ${TokenType[typeOrStr]}`))
                }
                return value
            }
        }
        throw new Error("token null")
    }
    public assertValue(typeOrStr: TokenType | string): Token {
        const { value } = this
        if (!value) throw new Error("not assert value not null")
        if (typeof typeOrStr === 'string') {
            if (value.str !== typeOrStr) {
                throw new Error("not assert value string " + typeOrStr)
            }
            return value
        } else {
            if (value.type !== typeOrStr) {
                throw new Error("not assert value type " + TokenType[typeOrStr])
            }
            return value
        }
    }
}
const factory = new TokenFactory

export class Proto {
    children: (Import | Package | Syntax | Enum | MessageProp)[] = []
    constructor(it: IterableIterator<Token>) {
        factory.init(it)
        let value: Token | void
        while (value = factory.next()) {
            switch (value.str) {
                case 'syntax':
                    this.children.push(new Syntax)
                    break
                case 'import':
                    this.children.push(new Import)
                    break
                case 'package':
                    this.children.push(new Package)
                    break
                case 'message':
                    this.children.push(new Message)
                    break
                case 'enum':
                    this.children.push(new Enum)
                    break
                default: throw new Error("error str: " + value.str)
            }
        }
    }
    package = ''
    imports: string[] = []
    enums: Set<string> = new Set
    compile() {
        for (let x of this.children) {
            if (x instanceof Package) {
                this.package = x.value
            } else if (x instanceof Import) {
                this.imports.push(x.value)
            } else if (x instanceof Enum) {
                this.enums.add(x.name)
            }
        }
    }
}

export class Syntax {
    value: string
    comment: Comment
    constructor() {
        this.comment = factory.take()
        factory.assertNext("=")
        this.value = factory.assertNext(TokenType.STRING).str
    }
}

export class Import {
    value: string
    comment: Comment
    constructor(){
        this.comment = factory.take()
        this.value = factory.assertNext(TokenType.STRING).str
    }
}

export class Package {
    value: string
    comment: Comment
    constructor() {
        this.comment = factory.take()
        this.value = factory.assertNext(TokenType.ID).str
    }
}

export class EnumProp {
    name: string
    value: number
    comment: Comment
    constructor() {
        this.comment = factory.take()
        this.name = factory.assertValue(TokenType.ID).str
        factory.assertNext('=')
        this.value = parseInt(factory.assertNext(TokenType.INT).str)
    }
}

export class Enum {
    name: string
    comment: Comment
    props: EnumProp[] = []
    constructor() {
        this.comment = factory.take()
        this.name = factory.assertNext(TokenType.ID).str
        let token: Token | void = factory.assertNext("{")
        while ((token = factory.next()) && token.str !== '}') {
            this.props.push(new EnumProp)
        }
        factory.flushComment()
    }
}

export class MessageProp {
    repeated: boolean = false
    type: string
    name: string
    value: number
    comment: Comment
    constructor() {
        this.comment = factory.take()
        const fb = factory.assertValue(TokenType.ID).str
        switch (fb) {
            case 'repeated':
                this.repeated = true
                this.type = factory.assertNext(TokenType.ID).str
                break
            default:
                this.type = fb
        }
        this.name = factory.assertNext(TokenType.ID).str
        factory.assertNext("=")
        this.value = parseInt(factory.assertNext(TokenType.INT).str)
    }
}
export class Message {
    name: string
    comment: Comment
    props: MessageProp[] = []
    constructor() {
        this.comment = factory.take()
        this.name = factory.assertNext(TokenType.ID).str
        let token: Token | void = factory.assertNext("{")
        while ((token = factory.next()) && token.str !== '}') {
            this.props.push(new MessageProp)
        }
        factory.flushComment()
    }
}
