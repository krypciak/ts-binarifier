import { Node } from './node'

export class JsonNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(_indent: number = 0, ignoreOptional?: boolean) {
        return 'any'.magenta + this.optionalSuffix(ignoreOptional)
    }
}
