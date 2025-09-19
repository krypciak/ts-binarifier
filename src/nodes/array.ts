import { Node } from './node'
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

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(
            data,
            data =>
                this.sizeNode.genEncode({ ...data, varName: `${data.varName}.length` }) +
                '\n' +
                Node.indent(data.indent) +
                `for (const v${data.indent} of ${data.varName}) {\n` +
                Node.indent(data.indent + 1) +
                `${this.type.genEncode({ ...data, varName: `v${data.indent}`, indent: data.indent + 1 })}` +
                `\n` +
                Node.indent(data.indent) +
                `}`
        )
    }

    genDecode(data: GenDecodeData): string {
        return this.genDecodeWrapOptional(
            `new Array(` +
                this.sizeNode.genDecode(data) +
                `).fill(null).map(_ => (\n` +
                Node.indent(data.indent + 1) +
                `${this.type.genDecode({ ...data, indent: data.indent + 1 })}` +
                `\n` +
                Node.indent(data.indent) +
                `))`
        )
    }
}
