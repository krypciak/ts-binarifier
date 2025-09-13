export abstract class Node {
    static jsonVarName = 'json'
    static bufVarName = 'buf'
    static indexVarName = 'i'

    static indentMulti = 2

    protected optionalSuffix(ignoreOptional: boolean | undefined) {
        return this.optional && ignoreOptional ? ' | ' + 'undefined'.gray : ''
    }

    constructor(public optional: boolean | undefined) {}

    abstract print(indent?: number, ignoreOptional?: boolean): string
    abstract genEncode(varName: string): string
}
