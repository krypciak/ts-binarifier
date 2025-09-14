import { Node } from './node'

export class RecordNode extends Node {
    constructor(
        optional: boolean | undefined,
        public key: Node,
        public value: Node
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return (
            'Record<' +
            this.key.print(indent) +
            ', ' +
            this.value.print(indent) +
            '>' +
            this.optionalSuffix(ignoreOptional)
        )
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(
            varName,
            indent =>
                `encoder.u8(Object.keys(${varName}).length)\n` +
                Node.indent(indent) +
                `for (const [k${indent}, v${indent}] of Object.entries(${varName}) as unknown as [keyof typeof ${varName}, NonNullable<(typeof ${varName})[keyof typeof ${varName}]>][]) {\n` +
                Node.indent(indent + 1) +
                `${this.key.genEncode(`k${indent}`, indent + 1)}` +
                '\n' +
                Node.indent(indent + 1) +
                `${this.value.genEncode(`v${indent}`, indent + 1)}` +
                `\n` +
                Node.indent(indent) +
                `}`,
            indent
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
