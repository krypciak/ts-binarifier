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
            Object.entries(this.nodes)
                .map(([k, v]) => Node.indent(indent) + k + ': ' + v.print(indent + 1))
                .join(`,`) +
            '\n' +
            Node.indent(indent) +
            '}' +
            this.optionalSuffix(ignoreOptional)
        )
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(
            varName,
            indent =>
                Object.entries(this.nodes)
                    .map(([k, v]) => v.genEncode(`${varName}['${k}']`, indent))
                    .join('\n' + Node.indent(indent)),
            indent
        )
    }

    genDecode(indent: number = 0): string {
        return this.genDecodeWrapOptional(
            `{\n` +
                `${Object.entries(this.nodes)
                    .map(([k, v]) => Node.indent(indent + 1) + `'${k}': ${v.genDecode(indent + 1)}`)
                    .join(',\n')}` +
                `\n` +
                Node.indent(indent) +
                `}`
        )
    }
}
