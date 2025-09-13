import { Node } from './node'

export class ArrayConstNode extends Node {
    constructor(
        optional: boolean | undefined,
        public indexTypes: Node[]
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return '[' + this.indexTypes.map(t => t.print(indent)).join(', ') + ']' + this.optionalSuffix(ignoreOptional)
    }
}
