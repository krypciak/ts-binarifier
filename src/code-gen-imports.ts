import type { ImportsRecord } from './types'

export function addImport(imports: ImportsRecord, importPath: string, name: string, type?: boolean) {
    const rec1 = (imports[importPath] ??= {})
    if (type) {
        rec1[name] ??= false
    } else {
        rec1[name] ||= true
    }
}

function getImportStatement(importPath: string, values: string[], isType: boolean) {
    return `import ` + (isType ? 'type ' : '') + `{ ` + values.join(', ') + ` } from '` + importPath + `'`
}

export function importsToString(imports: ImportsRecord): string {
    return Object.entries(imports)
        .flatMap(([importPath, entries]) => {
            const typeOnlyEntries = Object.entries(entries)
                .filter(([_, isValue]) => !isValue)
                .map(([name]) => name)
            const valueOnlyEntries = Object.entries(entries)
                .filter(([_, isValue]) => isValue)
                .map(([name]) => name)
            const ret: string[] = []
            if (typeOnlyEntries.length > 0) {
                ret.push(getImportStatement(importPath, typeOnlyEntries, true))
            }
            if (valueOnlyEntries.length > 0) {
                ret.push(getImportStatement(importPath, valueOnlyEntries, false))
            }
            return ret
        })
        .join('\n')
}
