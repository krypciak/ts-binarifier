import { Node, type GenEncodeConfig, type GenEncodeData } from './node'

export class RecordNode extends Node {
    constructor(
        optional: boolean | undefined,
        public key: Node,
        public value: Node
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
                `encoder.u8(Object.keys(${varName}).length)\n` +
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

    genDecode(indent: number = 0): string {
        return this.genDecodeWrapOptional(
            `Object.fromEntries(new Array(decoder.u8()).fill(null).map(_ => [\n` +
                Node.indent(indent + 1) +
                `${this.key.genDecode(indent + 1)}, ${this.value.genDecode(indent + 1)}` +
                `\n` +
                Node.indent(indent) +
                `]))`
        )
    }
}
