import { Node } from './node'

export class InterfaceNode extends Node {
    constructor(
        optional: boolean | undefined,
        public nodes: Record<string, Node>
    ) {
        super(optional)
    }

    static print(nodes: Record<string, Node>, noColor?: boolean, indent: number = 0) {
        return (
            '{\n' +
            Object.entries(nodes)
                .map(
                    ([k, v]) =>
                        Node.indent(indent + 1) +
                        k +
                        (v.optional ? '?' : '') +
                        ': ' +
                        v.print(noColor, indent + 1, true)
                )
                .join(`,\n`) +
            '\n' +
            Node.indent(indent) +
            '}'
        )
    }

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return InterfaceNode.print(this.nodes, noColor, indent) + this.optionalSuffix(ignoreOptional, noColor)
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
