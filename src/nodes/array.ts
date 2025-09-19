import { Node, type GenDecodeConfig, type GenDecodeData, type GenEncodeConfig, type GenEncodeData } from './node'
import { NumberNode, NumberType } from './number'

export class ArrayNode extends Node {
    constructor(
        optional: boolean | undefined,
        public type: Node,
        public sizeNode = new NumberNode(false, 16, NumberType.Signed)
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
                this.sizeNode.genEncode({ varName: `${varName}.length`, indent }, config) +
                '\n' +
                Node.indent(indent) +
                `for (const v${indent} of ${data.varName}) {\n` +
                Node.indent(indent + 1) +
                `${this.type.genEncode({ varName: `v${data.indent}`, indent: indent + 1 }, config)}` +
                `\n` +
                Node.indent(indent) +
                `}`
        )
    }

    genDecode(data: GenDecodeData, config: GenDecodeConfig): string {
        const indent = data.indent
        return this.genDecodeWrapOptional(
            `new Array(` +
                this.sizeNode.genDecode(data, config) +
                `).fill(null).map(_ => (\n` +
                Node.indent(indent + 1) +
                `${this.type.genDecode({ indent: indent + 1 }, config)}` +
                `\n` +
                Node.indent(indent) +
                `))`
        )
    }
}
