import { getOrDefineFunction } from '../code-gen-functions'
import { gray, green } from '../colors'
import type { GenEncodeData, GenDecodeData, IndividualPrintConfig, SharedPrintConfig } from '../types'
import { EnumNode } from './enum'
import { InterfaceNode } from './interface'
import { LiteralNode } from './literal'
import { Node } from './node'

export class UnionNode extends Node {
    constructor(
        optional: boolean | undefined,
        public keyName: string,
        public keyNode: EnumNode<string | number | boolean>,
        public dataNodes: Record<string, InterfaceNode>
    ) {
        super(optional)
        for (const key of keyNode.values) {
            dataNodes[`${key}`].nodes = Object.fromEntries([
                [keyName, new LiteralNode(false, key)],
                ...Object.entries(dataNodes[`${key}`].nodes),
            ])
        }
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return (
            (shr.noColor
                ? ''
                : gray(`/* union key `, shr.noColor) +
                  green(`'${this.keyName}'`, shr.noColor) +
                  gray(`: `, shr.noColor) +
                  this.keyNode.toString(shr, { indent: ind.indent + 1 }) +
                  gray(` */ `, shr.noColor)) +
            '(' +
            this.toStringWrapInOptionalUnion(
                shr,
                ind,
                this.keyNode.values
                    .map(
                        (key, i) =>
                            (i > 0 ? Node.indent(ind.indent) : '') +
                            InterfaceNode.print(
                                shr,
                                { indent: ind.indent + 1 },
                                {
                                    [this.keyName]: new LiteralNode(false, this.keyNode.values[i]),
                                    ...this.dataNodes[`${key}`].nodes,
                                }
                            )
                    )
                    .join(' | ') + ')'
            )
        )
    }

    genEncode(data: GenEncodeData): string {
        const funcName = 'encodeUnion' + data.varCounter.func++
        const indexVar = this.keyNode.getIndexVarName(data)
        data.varCounter.v--

        const funcConfig = getOrDefineFunction(data, {
            name: funcName,
            arguments: ['encoder: Encoder', `data: ` + this.toStringInGen(data, { indent: 0 })],
            body:
                `${this.keyNode.genEncode({ ...data, indent: 0, varName: data.varName + InterfaceNode.genPropertyAccess(this.keyName) })}\n` +
                `switch (${indexVar}) {\n` +
                this.keyNode.values
                    .map(
                        (key, i) =>
                            Node.indent(1) +
                            `case ${i}: { // ${this.keyName}: ${new LiteralNode(false, key).printNoColor()}\n` +
                            Node.indent(2) +
                            this.dataNodes[`${key}`].genEncode({ ...data, indent: 2 }) +
                            '\n' +
                            Node.indent(2) +
                            `break\n` +
                            Node.indent(1) +
                            `}\n`
                    )
                    .join('') +
                `}`,
        })

        return this.genEncodeWrapOptional(data, data => `this.` + funcConfig.name + `(encoder, ${data.varName})`)
    }

    genDecode(data: GenDecodeData): string {
        const indexVar = this.keyNode.getIndexVarName(data)

        const funcConfig = getOrDefineFunction(data, {
            name: 'decodeUnion' + data.varCounter.func++,
            arguments: ['decoder: Decoder'],
            body:
                `const ${indexVar} = ${this.keyNode.unionIdNode.genDecode(data)}\n` +
                `switch (${indexVar}) {\n` +
                this.keyNode.values
                    .map(
                        (key, i) =>
                            Node.indent(1) +
                            `case ${i}: ` +
                            `return ` +
                            this.dataNodes[`${key}`].genDecode({ ...data, indent: 1 }) +
                            '\n'
                    )
                    .join('') +
                `}\n`,
        })

        return this.genDecodeWrapOptional(`this.` + funcConfig.name + `(decoder)`)
    }
}
