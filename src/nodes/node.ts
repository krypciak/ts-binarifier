import { gray } from '../colors'

export interface GenEncodeData {
    varName: string
    indent: number
}
export interface GenEncodeConfig {
    asserts?: boolean
}

export interface GenDecodeData {
    indent: number
}
export interface GenDecodeConfig {
    asserts?: boolean
}

export abstract class Node {
    static jsonVarName = 'json'
    static bufVarName = 'buf'
    static indexVarName = 'i'

    static indentMulti = 4

    static indent(v: number = 0) {
        return ' '.repeat(v * Node.indentMulti)
    }

    protected optionalSuffix(ignoreOptional: boolean | undefined, noColor: boolean | undefined) {
        return this.optional && !ignoreOptional ? ' | ' + gray('undefined', noColor) : ''
    }

    protected genEncodeWrapOptional(
        { varName, indent }: GenEncodeData,
        _config: GenEncodeConfig,
        strFunc: (data: GenEncodeData) => string
    ) {
        if (this.optional) {
            indent++
            const str = strFunc({ varName, indent })
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
            const str = strFunc({ varName, indent })
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

    abstract print(noColor?: boolean, indent?: number, ignoreOptional?: boolean): string
    abstract genEncode(data: GenEncodeData, config: GenEncodeConfig): string
    abstract genDecode(data: GenDecodeData, config: GenDecodeConfig): string
}
