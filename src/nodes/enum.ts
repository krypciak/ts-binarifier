import { Node } from './node'
import { NumberNode } from './number'
import { gray, green } from '../colors'
import { assert } from '../assert'

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

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return (
            gray(`/* (`, noColor) +
            this.unionIdNode.print(noColor) +
            gray(`) */ `, noColor) +
            (this.values.length > 0 ? '(' : '') +
            this.values.map(str => green(`'${str}'`, noColor)).join(' | ') +
            (this.values.length > 0 ? ')' : '') +
            this.optionalSuffix(ignoreOptional, noColor)
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

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data =>
            this.unionIdNode.genEncode({
                ...data,
                varName: this.genEncodeAccess(data),
            })
        )
    }

    genDecode(data: GenDecodeData): string {
        const unionVarName = this.getUnionVarName(data)
        assert(unionVarName)

        return `${this.genDecodeWrapOptional(unionVarName + `[${this.unionIdNode.genDecode(data)}]`)}`
    }
}
