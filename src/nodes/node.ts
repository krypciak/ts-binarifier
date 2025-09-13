export abstract class Node {
    static jsonVarName = 'json'
    static bufVarName = 'buf'
    static indexVarName = 'i'

    static indentMulti = 4

    static indent(v: number = 0) {
        return ' '.repeat(v * Node.indentMulti)
    }

    protected optionalSuffix(ignoreOptional: boolean | undefined) {
        return this.optional && ignoreOptional ? ' | ' + 'undefined'.gray : ''
    }

    protected genEncodeWrapOptional(varName: string, strFunc: (indent: number) => string, indent: number) {
        if (this.optional) {
            indent++
            const str = strFunc(indent)
            const insertNewLineAtStart = true
            const lastStr = str.at(-1)
            const insertNewLineAtEnd = true || lastStr == ' ' || lastStr == '\n' || lastStr == '}'
            return (
                `if (${varName} === undefined) encoder.u1(); else {` +
                (insertNewLineAtStart ? '\n' + Node.indent(indent) : '') +
                str +
                (insertNewLineAtEnd ? '\n' + Node.indent(indent - 1) : '') +
                '}'
            )
        } else {
            const str = strFunc(indent)
            return str
        }
    }

    protected genDecodeWrapOptional(str: string) {
        if (this.optional) {
            return `decoder.u1(false) ? ${str} : undefined`
        } else {
            return str
        }
    }

    constructor(public optional: boolean | undefined) {}

    abstract print(indent?: number, ignoreOptional?: boolean): string
    abstract genEncode(varName: string, indent?: number): string
    abstract genDecode(indent?: number): string
}
