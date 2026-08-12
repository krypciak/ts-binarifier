export interface SharedPrintConfig {
    noColor?: boolean
    imports?: ImportsRecord
    typeAliasesImportPath?: string
}
export interface IndividualPrintConfig {
    indent: number
    ignoreOptional?: boolean
}

export interface FunctionConfig {
    name: string
    arguments: string[]
    body: string
    public?: boolean
    returnType?: string
}

export interface GenDataBase {
    varCounter: { v: number }
    indent: number

    functionHashToName: Record<string, string>
    functions: Record<string, FunctionConfig>
    imports: ImportsRecord
    typeAliasesImportPath: string
}
export interface GenEncodeData extends GenDataBase {
    config: GenEncodeConfig
    shared: GenEncodeDecodeShared

    varName: string
    constants: string[]
}
export interface GenEncodeConfig {
    asserts?: boolean
}
export interface GenEncodeDecodeShared {
    unionTypes?: Record<string, (string | number | boolean)[]>
}
export interface GenDecodeData extends GenDataBase {
    config: GenDecodeConfig
    shared: GenEncodeDecodeShared
}

export interface GenDecodeConfig {}

/* true - import value, false - import type */
export type ImportsRecord = Record<string, Record<string, boolean>>
