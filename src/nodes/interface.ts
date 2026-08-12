import { addImport } from '../code-gen-imports'
import type { GenEncodeData, GenDecodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'
import { Node } from './node'

export class InterfaceNode extends Node {
    constructor(
        optional: boolean | undefined,
        public nodes: Record<string, Node>,
        public name?: string,
        public importPath?: string
    ) {
        super(optional)
    }

    static print(shr: SharedPrintConfig, ind: IndividualPrintConfig, nodes: Record<string, Node>) {
        return (
            '{\n' +
            Object.entries(nodes)
                .map(
                    ([k, v]) =>
                        Node.indent(ind.indent + 1) +
                        k +
                        (v.optional ? '?' : '') +
                        ': ' +
                        v.toString(shr, { indent: ind.indent + 1, ignoreOptional: true })
                )
                .join(`,\n`) +
            '\n' +
            Node.indent(ind.indent) +
            '}'
        )
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        if (this.name && !shr.noInterfaceNameShorted) {
            addImport(shr.imports, this.importPath!, this.name, true)
            return this.toStringWrapInOptionalUnion(shr, ind, this.name)
        }
        return this.toStringWrapInOptionalUnion(shr, ind, InterfaceNode.print(shr, ind, this.nodes))
    }

    static isStringQuotingNeeded(key: string): boolean {
        const identifierRegex = /^[A-Za-z_$][A-Za-z0-9_$]*$/

        // prettier-ignore
        const reserved = new Set([
           'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
           'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
           'false', 'finally', 'for', 'function', 'if', 'import', 'in',
           'instanceof', 'new', 'null', 'return', 'super', 'switch',
           'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
           'while', 'with', 'yield'
        ]);

        const canUseDotNotation = identifierRegex.test(key) && !reserved.has(key)
        return !canUseDotNotation
    }

    static genPropertyAccess(key: string): string {
        if (this.isStringQuotingNeeded(key)) {
            return `['${key}']`
        } else {
            return `.${key}`
        }
    }

    static genStringProperty(key: string): string {
        if (this.isStringQuotingNeeded(key)) {
            return `'${key}'`
        } else {
            return key
        }
    }

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data =>
            Object.entries(this.nodes)
                .map(([k, v]) => v.genEncode({ ...data, varName: data.varName + InterfaceNode.genPropertyAccess(k) }))
                .join('\n' + Node.indent(data.indent))
        )
    }

    genDecode(data: GenDecodeData): string {
        const indent = data.indent
        return this.genDecodeWrapOptional(
            `{\n` +
                `${Object.entries(this.nodes)
                    .map(
                        ([k, v]) =>
                            Node.indent(indent + 1) +
                            InterfaceNode.genStringProperty(k) +
                            `: ` +
                            v.genDecode({ ...data, indent: indent + 1 })
                    )
                    .join(',\n')}` +
                `\n` +
                Node.indent(indent) +
                `}`
        )
    }
}
