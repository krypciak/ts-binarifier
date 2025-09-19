import { Node } from './node'
import { NumberNode, NumberType } from './number'

export class RecordNode extends Node {
    constructor(
        optional: boolean | undefined,
        public key: Node,
        public value: Node,
        public sizeNode = new NumberNode(false, 8, NumberType.Unsigned)
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

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data => {
            const keyVar = `k${data.varCounter.v++}`
            const valueVar = `v${data.varCounter.v++}`
            return (
                this.sizeNode.genEncode({ ...data, varName: `Object.keys(${data.varName}).length` }) +
                '\n' +
                Node.indent(data.indent) +
                `for (const [${keyVar}, ${valueVar}] of Object.entries(${data.varName})` +
                ` as unknown as [keyof typeof ${data.varName}, NonNullable<(typeof ${data.varName})[keyof typeof ${data.varName}]>][]) {\n` +
                Node.indent(data.indent + 1) +
                `${this.key.genEncode({ ...data, varName: keyVar, indent: data.indent + 1 })}` +
                '\n' +
                Node.indent(data.indent + 1) +
                `${this.value.genEncode({ ...data, varName: valueVar, indent: data.indent + 1 })}` +
                `\n` +
                Node.indent(data.indent) +
                `}`
            )
        })
    }

    genDecode(data: GenDecodeData): string {
        const indent = data.indent
        return this.genDecodeWrapOptional(
            `Object.fromEntries(new Array(` +
                this.sizeNode.genDecode(data) +
                `).fill(null).map(_ => [\n` +
                Node.indent(indent + 1) +
                `${this.key.genDecode({ ...data, indent: indent + 1 })}, ${this.value.genDecode({ ...data, indent: indent + 1 })}` +
                `\n` +
                Node.indent(indent) +
                `]))`
        )
    }
}
