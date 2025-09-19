import { gray } from '../colors'

declare global {
    interface GenEncodeData {
        config: GenEncodeConfig
        varCounter: { v: number }
        indent: number
        shared: GenEncodeDecodeShared

        varName: string
        constants: string[]
    }
    interface GenEncodeConfig {
        asserts?: boolean
    }
    interface GenEncodeDecodeShared {}

    interface GenDecodeData {
        config: GenDecodeConfig
        varCounter: { v: number }
        indent: number
        shared: GenEncodeDecodeShared
    }
    interface GenDecodeConfig {}
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

    protected genEncodeWrapOptional(data: GenEncodeData, strFunc: (data: GenEncodeData) => string) {
        if (this.optional) {
            data.indent++
            const str = strFunc(data)
            return (
                `if (${data.varName} === undefined) encoder.boolean(false); else {` +
                '\n' +
                Node.indent(data.indent) +
                `encoder.boolean(true)\n` +
                Node.indent(data.indent) +
                str +
                '\n' +
                Node.indent(data.indent - 1) +
                '}'
            )
        } else {
            const str = strFunc(data)
            return str
        }
    }

    protected static genEncodeAssertNot({ varName, indent, config }: GenEncodeData, msg: string) {
        if (!config.asserts || !varName) return ''
        return `if (${varName}) throw new Error(\`${msg}\`)` + '\n' + Node.indent(indent)
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
    abstract genEncode(data: GenEncodeData): string
    abstract genDecode(data: GenDecodeData): string
}
