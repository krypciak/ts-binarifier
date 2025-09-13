import { Node } from './node'

export class ArrayNode extends Node {
    constructor(
        optional: boolean | undefined,
        public type: Node
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return this.type.print(indent) + '[]' + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(
            varName,
            indent =>
                `encoder.u16(${varName}.length)\n` +
                Node.indent(indent) +
                `for (const v${indent} of ${varName}) {\n` +
                Node.indent(indent + 1) +
                `${this.type.genEncode(`v${indent}`, indent + 1)}` +
                `\n` +
                Node.indent(indent) +
                `}`,
            indent
        )
    }

    genDecode(indent: number = 0): string {
        return this.genDecodeWrapOptional(
            `new Array(decoder.u16()).fill(null).map(_ => (\n` +
                Node.indent(indent + 1) +
                `${this.type.genDecode(indent + 1)}` +
                `\n` +
                Node.indent(indent) +
                `))`
        )
    }
}
