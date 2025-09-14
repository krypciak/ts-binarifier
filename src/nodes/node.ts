import { gray } from '../colors'

export abstract class Node {
    static jsonVarName = 'json'
    static bufVarName = 'buf'
    static indexVarName = 'i'

    static indentMulti = 4

    static indent(v: number = 0) {
        return ' '.repeat(v * Node.indentMulti)
    }

    protected optionalSuffix(ignoreOptional: boolean | undefined) {
        return this.optional && !ignoreOptional ? ' | ' + gray('undefined') : ''
    }

    protected genEncodeWrapOptional(varName: string, strFunc: (indent: number) => string, indent: number) {
        if (this.optional) {
            indent++
            const str = strFunc(indent)
            return (
                `if (${varName} === undefined || ${varName} === null) encoder.boolean(false); else {` +
                '\n' +
                Node.indent(indent) +
                `encoder.boolean(true)\n` +
                Node.indent(indent) +
                str +
                '\n' +
                Node.indent(indent - 1) +
                '}'
            )
        } else {
            const str = strFunc(indent)
            return str
        }
    }

    protected genDecodeWrapOptional(str: string) {
        if (this.optional) {
            return `decoder.boolean() ? ${str} : undefined`
        } else {
            return str
        }
    }

    constructor(public optional: boolean | undefined) {}

    abstract print(indent?: number, ignoreOptional?: boolean): string
    abstract genEncode(varName: string, indent?: number): string
    abstract genDecode(indent?: number): string
}
