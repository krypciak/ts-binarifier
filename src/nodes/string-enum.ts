import { gray, green } from '../colors'
import { Node, type GenEncodeConfig, type GenEncodeData } from './node'
import { NumberNode } from './number'

export class StringEnumNode extends Node {
    private unionIdNode: NumberNode

    constructor(
        optional: boolean | undefined,
        public values: string[]
    ) {
        super(optional)
        this.unionIdNode = NumberNode.optimalForRange(false, 0, values.length)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return (
            gray(`/* (`) +
            this.unionIdNode.print(noColor) +
            gray(`) */ `) +
            (this.values.length > 0 ? '(' : '') +
            this.values.map(str => green(`'${str}'`), noColor).join(' | ') +
            (this.values.length > 0 ? ')' : '') +
            this.optionalSuffix(ignoreOptional, noColor)
        )
    }

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(data, config, ({ varName, indent }) =>
            this.unionIdNode.genEncode(
                { varName: `[${this.values.map(str => `'${str}'`).join(', ')}]` + `.indexOf(${varName})`, indent },
                config
            )
        )
    }

    genDecode(): string {
        return `${this.genDecodeWrapOptional(
            `[${this.values.map(str => `'${str}'`).join(', ')}]` + `[${this.unionIdNode.genDecode()}]`
        )}`
    }
}
