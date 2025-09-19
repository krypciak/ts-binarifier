import { Node, type GenDecodeConfig, type GenDecodeData, type GenEncodeConfig, type GenEncodeData } from './node'

export class InterfaceNode extends Node {
    constructor(
        optional: boolean | undefined,
        public nodes: Record<string, Node>
    ) {
        super(optional)
    }

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return (
            '{\n' +
            Object.entries(this.nodes)
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
            '}' +
            this.optionalSuffix(ignoreOptional, noColor)
        )
    }

    isStringQuotingNeeded(key: string): boolean {
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

    genPropertyAccess(key: string): string {
        if (this.isStringQuotingNeeded(key)) {
            return `['${key}']`
        } else {
            return `.${key}`
        }
    }

    genStringProperty(key: string): string {
        if (this.isStringQuotingNeeded(key)) {
            return `'${key}'`
        } else {
            return key
        }
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(data, config, ({ varName, indent }) =>
            Object.entries(this.nodes)
                .map(([k, v]) => v.genEncode({ varName: varName + this.genPropertyAccess(k), indent }, config))
                .join('\n' + Node.indent(indent))
        )
    }

    genDecode(data: GenDecodeData, config: GenDecodeConfig): string {
        const indent = data.indent
        return this.genDecodeWrapOptional(
            `{\n` +
                `${Object.entries(this.nodes)
                    .map(
                        ([k, v]) =>
                            Node.indent(indent + 1) +
                            this.genStringProperty(k) +
                            `: ` +
                            v.genDecode({ indent: indent + 1 }, config)
                    )
                    .join(',\n')}` +
                `\n` +
                Node.indent(indent) +
                `}`
        )
    }
}
