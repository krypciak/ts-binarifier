import { Node } from './node'

export class StringNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'string'.green + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string): string {
        return `{ if (${varName} === undefined) bit(0) else { byte(${varName}.length); string(${varName}); } }`
    }
}
