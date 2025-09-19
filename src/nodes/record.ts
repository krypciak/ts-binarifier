import { Node, type GenDecodeConfig, type GenDecodeData, type GenEncodeConfig, type GenEncodeData } from './node'
import { NumberNode, NumberType } from './number'

export class RecordNode extends Node {
    constructor(
        optional: boolean | undefined,
        public key: Node,
        public value: Node,
        public sizeNode = new NumberNode(false, 8, NumberType.Signed)
    ) {
        super(optional)
    }

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return (
            'Record<' +
            this.key.print(noColor, indent) +
            ', ' +
            this.value.print(noColor, indent) +
            '>' +
            this.optionalSuffix(ignoreOptional, noColor)
        )
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(
            data,
            config,
            ({ varName, indent }) =>
                this.sizeNode.genEncode({ varName: `Object.keys(${varName}).length`, indent }, config) +
                '\n' +
                Node.indent(indent) +
                `for (const [k${indent}, v${indent}] of Object.entries(${varName}) as unknown as [keyof typeof ${varName}, NonNullable<(typeof ${varName})[keyof typeof ${varName}]>][]) {\n` +
                Node.indent(indent + 1) +
                `${this.key.genEncode({ varName: `k${indent}`, indent: indent + 1 }, config)}` +
                '\n' +
                Node.indent(indent + 1) +
                `${this.value.genEncode({ varName: `v${indent}`, indent: indent + 1 }, config)}` +
                `\n` +
                Node.indent(indent) +
                `}`
        )
    }

    genDecode(data: GenDecodeData, config: GenDecodeConfig): string {
        const indent = data.indent
        return this.genDecodeWrapOptional(
            `Object.fromEntries(new Array(` +
                this.sizeNode.genDecode(data, config) +
                `).fill(null).map(_ => [\n` +
                Node.indent(indent + 1) +
                `${this.key.genDecode({ indent: indent + 1 }, config)}, ${this.value.genDecode({ indent: indent + 1 }, config)}` +
                `\n` +
                Node.indent(indent) +
                `]))`
        )
    }
}
