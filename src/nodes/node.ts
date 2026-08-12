import { gray } from '../colors'
import type { GenEncodeData, GenDecodeData, GenDataBase, SharedPrintConfig, IndividualPrintConfig } from '../types'

export abstract class Node {
    static jsonVarName = 'json'
    static bufVarName = 'buf'
    static indexVarName = 'i'

    static indentMulti = 4

    static indent(v: number = 0) {
        return ' '.repeat(v * Node.indentMulti)
    }

    protected toStringWrapInOptionalUnion(shr: SharedPrintConfig, ind: IndividualPrintConfig, str: string) {
        if (this.optional && !ind.ignoreOptional) str += ' | ' + gray('undefined', shr.noColor)
        const addBrackets = str.includes('|')
        return (addBrackets ? '(' : '') + str + (addBrackets ? ')' : '')
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

    abstract toString(shared: SharedPrintConfig, individual: IndividualPrintConfig): string

    toStringInGen(data: GenDataBase, ind: IndividualPrintConfig): string {
        return this.toString(
            { noColor: true, imports: data.imports, typeAliasesImportPath: data.typeAliasesImportPath },
            ind
        )
    }

    printColor() {
        return this.toString({ noInterfaceNameShorted: true }, { indent: 0 })
    }
    printNoColor() {
        return this.toString({ noColor: true, noInterfaceNameShorted: true }, { indent: 0 })
    }

    abstract genEncode(data: GenEncodeData): string
    abstract genDecode(data: GenDecodeData): string
}
