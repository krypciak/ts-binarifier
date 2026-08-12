import { Node } from './node'
import { NumberNode } from './number'
import { gray } from '../colors'
import { assert } from '../assert'
import { LiteralNode } from './literal'
import type { GenEncodeData, GenDecodeData, GenDataBase, IndividualPrintConfig, SharedPrintConfig } from '../types'

export class EnumNode<T extends string | number | boolean> extends Node {
    unionIdNode: NumberNode

    constructor(
        optional: boolean | undefined,
        public values: T[],
        noSort: boolean = false
    ) {
        super(optional)
        if (!noSort) values.sort()
        this.unionIdNode = NumberNode.optimalForRange(false, 0, values.length - 1)
    }

    toString(shr: SharedPrintConfig, ind: IndividualPrintConfig) {
        return (
            (!shr.noColor
                ? gray(`/* (`, shr.noColor) +
                  this.unionIdNode.toString(shr, { indent: ind.indent + 1 }) +
                  gray(`) */ `, shr.noColor)
                : '') +
            this.toStringWrapInOptionalUnion(
                shr,
                ind,
                this.values.map(v => new LiteralNode(false, v).toString(shr, { indent: ind.indent + 1 })).join(' | ')
            )
        )
    }

    private getUnionVarName(data: GenEncodeData | GenDecodeData): string | undefined {
        data.shared.unionTypes ??= {}
        for (const varName in data.shared.unionTypes) {
            const arr = data.shared.unionTypes[varName]
            if (arr.length == this.values.length && arr.values().every((v, i) => v == this.values[i])) {
                return varName
            }
        }
    }

    private createUnionVarName(data: GenEncodeData): string {
        const varName = `union${data.varCounter.v++}`
        const valuesStrArr = `[${this.values.map(v => (typeof v == 'string' ? `'${v}'` : v)).join(', ')}]`
        data.constants.push(`${varName} = ${valuesStrArr} as const`)

        const thisVarName = 'this.' + varName
        data.shared.unionTypes![thisVarName] = this.values
        return thisVarName
    }

    genEncodeAccess(data: GenEncodeData) {
        const unionVarName = this.getUnionVarName(data) ?? this.createUnionVarName(data)
        return unionVarName + `.indexOf(${data.varName})`
    }

    getIndexVarName(data: GenDataBase) {
        return `i${data.varCounter.v++}`
    }

    genEncode(data: GenEncodeData): string {
        const indexVar = this.getIndexVarName(data)
        return this.genEncodeWrapOptional(
            data,
            data =>
                `const ${indexVar} = ${this.genEncodeAccess(data)}\n` +
                Node.indent(data.indent) +
                this.unionIdNode.genEncode({
                    ...data,
                    varName: indexVar,
                })
        )
    }

    genDecode(data: GenDecodeData): string {
        const unionVarName = this.getUnionVarName(data)
        assert(unionVarName)

        return `${this.genDecodeWrapOptional(unionVarName + `[${this.unionIdNode.genDecode(data)}]`)}`
    }
}
