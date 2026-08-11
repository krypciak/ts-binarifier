import { gray, green } from '../colors'
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

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return (
            gray(`/* union key `, noColor) +
            green(`'${this.keyName}'`, noColor) +
            gray(`: `, noColor) +
            this.keyNode.print(noColor, indent) +
            gray(` */ `, noColor) +
            '(' +
            this.keyNode.values
                .map(
                    (key, i) =>
                        (i > 0 ? Node.indent(indent) : '') +
                        InterfaceNode.print(
                            {
                                [this.keyName]: new LiteralNode(false, this.keyNode.values[i]),
                                ...this.dataNodes[`${key}`].nodes,
                            },
                            noColor,
                            indent
                        )
                )
                .join(' | ') +
            ')' +
            this.optionalSuffix(ignoreOptional, noColor)
        )
    }

    genEncode(data: GenEncodeData): string {
        const funcName = 'encodeUnion' + data.varCounter.v++
        const indexVar = this.keyNode.getIndexVarName(data)
        data.varCounter.v--

        const funcConfig: FunctionConfig = {
            name: funcName,
            arguments: ['encoder: Encoder', 'data: any'],
            body:
                `${this.keyNode.genEncode({ ...data, indent: 0, varName: data.varName + InterfaceNode.genPropertyAccess(this.keyName) })}\n` +
                `switch (${indexVar}) {\n` +
                this.keyNode.values
                    .map(
                        (key, i) =>
                            Node.indent(1) +
                            `case ${i}: { // ${this.keyName}: ${new LiteralNode(false, key).print(true)}\n` +
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
        }
        data.functions.push(funcConfig)

        return this.genEncodeWrapOptional(data, data => `this.` + funcConfig.name + `(encoder, ${data.varName})`)
    }

    genDecode(data: GenDecodeData): string {
        const indexVar = this.keyNode.getIndexVarName(data)

        const funcConfig: FunctionConfig = {
            name: 'decodeUnion' + data.varCounter.v++,
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
        }
        data.functions.push(funcConfig)

        return this.genDecodeWrapOptional(`this.` + funcConfig.name + `(decoder)`)
    }
}
