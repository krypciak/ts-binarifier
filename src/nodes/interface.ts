import { Node } from './node'

export class InterfaceNode extends Node {
    constructor(
        optional: boolean | undefined,
        public nodes: Record<string, Node>
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return (
            '{\n' +
            Object.entries(this.nodes)
                .map(([k, v]) => Node.indent(indent+1) + k + ': ' + v.print(indent + 1))
                .join(`,\n`) +
            '\n' +
            Node.indent(indent) +
            '}' +
            this.optionalSuffix(ignoreOptional)
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

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(
            varName,
            indent =>
                Object.entries(this.nodes)
                    .map(([k, v]) => v.genEncode(varName + this.genPropertyAccess(k), indent))
                    .join('\n' + Node.indent(indent)),
            indent
        )
    }

    genDecode(indent: number = 0): string {
        return this.genDecodeWrapOptional(
            `{\n` +
                `${Object.entries(this.nodes)
                    .map(
                        ([k, v]) => Node.indent(indent + 1) + this.genStringProperty(k) + `: ` + v.genDecode(indent + 1)
                    )
                    .join(',\n')}` +
                `\n` +
                Node.indent(indent) +
                `}`
        )
    }
}
