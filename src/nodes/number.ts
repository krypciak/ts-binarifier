import { Node } from './node'

export class NumberNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'number'.yellow + this.optionalSuffix(ignoreOptional)
    }
}
