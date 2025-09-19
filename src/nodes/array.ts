import { Node, type GenEncodeConfig, type GenEncodeData } from './node'

export class ArrayNode extends Node {
    constructor(
        optional: boolean | undefined,
        public type: Node
    ) {
        super(optional)
    }

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return this.type.print(noColor, indent) + '[]' + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(
            data,
            config,
            ({ varName, indent }) =>
                `encoder.u16(${varName}.length)\n` +
                Node.indent(indent) +
                `for (const v${indent} of ${data.varName}) {\n` +
                Node.indent(indent + 1) +
                `${this.type.genEncode({ varName: `v${data.indent}`, indent: indent + 1 }, config)}` +
                `\n` +
                Node.indent(indent) +
                `}`
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
