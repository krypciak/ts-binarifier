import ts from 'typescript'
import { Node } from './nodes/node'
import { NumberNode } from './nodes/number'
import { StringNode } from './nodes/string'
import { BooleanNode } from './nodes/boolean'
import { ArrayNode } from './nodes/array'
import { RecordNode } from './nodes/record'
import { InterfaceNode } from './nodes/interface'
import { ArrayConstNode } from './nodes/array-const'
import { JsonNode } from './nodes/json'
import { assert } from './assert'

export function parseToNode(type: ts.Type, checker: ts.TypeChecker, indent = 0, isOptional?: boolean): Node {
    const spacing = '  '.repeat(indent)

    if (type.isUnion()) {
        const isOptional =
            type.types.findIndex(t => t.flags & ts.TypeFlags.Undefined || t.flags & ts.TypeFlags.Null) != -1
        const truthyType = type.getNonNullableType()

        console.log(spacing, 'union found, isOptional:', isOptional, checker.typeToString(type))

        if (truthyType.isUnion()) {
            let truthyTypes = truthyType.types
            {
                /* merge boolean literals */
                let boolType = truthyTypes.find(t => t.flags & ts.TypeFlags.BooleanLiteral)
                if (boolType) {
                    truthyTypes = truthyTypes.filter(t => !(t.flags & ts.TypeFlags.BooleanLiteral))
                    truthyTypes.push(boolType)
                }
            }
            {
                /* merge number literals */
                let numberType = truthyTypes.find(t => t.flags & ts.TypeFlags.NumberLiteral)
                if (numberType) {
                    truthyTypes = truthyTypes.filter(t => !(t.flags & ts.TypeFlags.NumberLiteral))
                    truthyTypes.push(numberType)
                }
            }
            {
                /* merge enums */
                let enumType = truthyTypes.find(t => t.flags & ts.TypeFlags.EnumLiteral || t.flags & ts.TypeFlags.Enum)
                if (enumType) {
                    truthyTypes = truthyTypes.filter(
                        t => !(t.flags & ts.TypeFlags.EnumLiteral || t.flags & ts.TypeFlags.Enum)
                    )
                    truthyTypes.push(enumType)
                }
            }
            {
                /* merge string literals */
                let stringType = truthyTypes.find(t => t.flags & ts.TypeFlags.StringLiteral)
                if (stringType) {
                    truthyTypes = truthyTypes.filter(t => !(t.flags & ts.TypeFlags.StringLiteral))
                    truthyTypes.push(stringType)
                }
            }

            if (truthyTypes.length == 1) {
                const type1 = truthyTypes[0]
                return parseToNode(type1, checker, indent, isOptional)
            } else {
                console.log(truthyTypes.map(t => [t.flags, t.symbol?.name]))
                throw new Error(`truthy types other than 1: ${truthyTypes.length}`)
            }
        } else {
            return parseToNode(truthyType, checker, indent, isOptional)
        }
    } else if (type.isIntersection()) {
        console.log(spacing, 'intersection')
        throw new Error('unimplemented intersection')
    } else if (type.isLiteral()) {
        console.log(spacing, 'literal', type.value)

        if (typeof type.value == 'number') {
            return new NumberNode(isOptional)
        } else if (typeof type.value == 'string') {
            return new StringNode(isOptional)
        } else throw new Error(`unimplemented literal, typeof type.value == ${typeof type.value}`)
    } else if (type.flags & ts.TypeFlags.Number) {
        console.log(spacing, 'number')
        return new NumberNode(isOptional)
    } else if (type.flags & ts.TypeFlags.BooleanLiteral || type.flags & ts.TypeFlags.Boolean) {
        console.log(spacing, 'boolean')
        return new BooleanNode(isOptional)
    } else if (type.flags & ts.TypeFlags.String) {
        return new StringNode(isOptional)
    } else if (type.flags & ts.TypeFlags.Enum) {
        console.log(spacing, 'enum')
        return new NumberNode(isOptional)
    } else if (checker.isArrayType(type)) {
        const indexType = type.getNumberIndexType()
        assert(indexType)
        return new ArrayNode(isOptional, parseToNode(indexType, checker, indent + 1))
    } else if (type.symbol?.flags == 2048 && type.aliasTypeArguments) {
        console.log(spacing, 'record')
        const keyType = type.aliasTypeArguments[0]
        const keyNode = parseToNode(keyType, checker, indent + 1)

        const valueType = type.aliasTypeArguments[1]
        const valueNode = parseToNode(valueType, checker, indent + 1)

        return new RecordNode(isOptional, keyNode, valueNode)
    } else if (type.symbol) {
        const name = type.symbol.name
        console.log(spacing, `type: ${checker.typeToString(type)} (${name})`)
        assert(name != 'Array')

        const props = type.getProperties()
        console.log(spacing, 'properties:')
        const nodes = Object.fromEntries(
            props.map(p => {
                const propType = checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || p.declarations?.[0]!)
                return [p.name, parseToNode(propType, checker, indent + 1)]
            })
        )
        return new InterfaceNode(isOptional, nodes)
    } else if (checker.isArrayLikeType(type)) {
        const types: ts.Type[] = (type as any).resolvedTypeArguments
        assert(types)
        return new ArrayConstNode(
            isOptional,
            types.map(t => parseToNode(t, checker, indent + 1))
        )
    } else if (type.flags & ts.TypeFlags.NonPrimitive || type.flags & ts.TypeFlags.Unknown) {
        return new JsonNode(isOptional)
    } else {
        throw new Error(`unimplemented: ${checker.typeToString(type)}, flags: ${type.flags}`)
    }
}

function printType(type: ts.Type, checker: ts.TypeChecker, indent = 0) {
    if (indent == 0) console.log('\n')
    const spacing = '  '.repeat(indent)

    if (type.isUnion()) {
        console.log(spacing + 'Union:', '(flags:', type.flags, ')')
        type.types.forEach(t => printType(t, checker, indent + 1))
        return
    }

    if (type.isIntersection()) {
        console.log(spacing + 'Intersection:', '(flags:', type.flags, ')')
        type.types.forEach(t => printType(t, checker, indent + 1))
        return
    }

    if (type.isLiteral()) {
        console.log(spacing + `Literal: ${checker.typeToString(type)}`, '(flags:', type.flags, ')')
        return
    }

    if (type.symbol) {
        const name = type.symbol.name
        console.log(spacing + `Type: ${checker.typeToString(type)} (${name})`, '(flags:', type.flags, ')')
        if (name == 'Array') return

        // Print properties recursively
        const props = type.getProperties()
        if (props.length) {
            console.log(spacing + 'Properties:')
            props.forEach(p => {
                const propType = checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || p.declarations?.[0]!)
                console.log(spacing + `  ${p.name}:`)
                printType(propType, checker, indent + 2)
            })
        }
        return
    }

    // Fallback for anonymous or intrinsic types
    console.log(spacing + `Type: ${checker.typeToString(type)}`, '(flags:', type.flags, ')')
}
