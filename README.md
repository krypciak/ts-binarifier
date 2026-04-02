# typescript binarifier

Generate typescript data binary serialization and deserialization code given typescript types.  
This project created was for the specific use case of real-time data transfer for a multiplayer mod for a fast-paced rpg game.  
The mod is called [cc-multibakery](https://github.com/krypciak/cc-multibakery), and this project is called in [this file](https://github.com/krypciak/cc-multibakery/blob/main/build/generate-binary-encode-decode-scripts.ts).  
This means:
- so only basic types work, most more complex types will likely not work
- there's no need for binary format versioning, so when typescript types change newly generated decoders will most likely crash when attempting to read data generated with an old encoder
- data is packed as tightly as possible

## Data types

- `boolean` is one bit
- `f64` is a 8 byte floating point number (double)
- `f32` is a 4 byte floating point number (float)
- `number` is `f64` by default, can be changed to `f32` in config
- `u8` is 1 byte unsigned integer (0 to 255)
- `u4` is 4 bits, not 1 byte with wasted space (0 to 15)
- `i8` is 8 bits (-128 to 127)
- there are types from `u2` and `i2` up to `u32` and `i32`
- note: value range checks are enabled by default and can be disabled
- `string` is encoded using `TextEncoder`, length is stored first (max lenght 2^16), then data follows
- `any` and `unknown` are parsed into JSON and saved as `string` with max length of 2^24
- arrays are supported, default max length is 2^16
  max length can be extended with:
```typescript
import type { RecordSize, u24 } from 'ts-binarifier/src/type-aliases'
type MyType = number[] & RecordSize<u24>
```
- records are supported, default max length is 2^8
  max length can be extended with:
```typescript
import type { RecordSize, u24 } from 'ts-binarifier/src/type-aliases'
type MyType = Record<number, string> & RecordSize<u24>
```
- interfaces (objects with known field names) are supported, the field names are not encoded
- known size arrays like `[number, string]` are supported and encoded like interfaces
- optional types are supported:
  - if the value exist, it takes up 1 bit (1) + T bits
  - if the value is undefined, it takes up only 1 bit (0)

You also can look at what's supported in the test file: [./src/test/index.test.ts](./src/test/index.test.ts)

## Generated code examples

Input type:
```typescript
import type { i2, u2, f32, u32, i32 } from 'ts-binarifier/src/type-aliases'
type MyType = {
    a: i2
    b: u2
    c: f32
    d: u32
    e: i32
}
```

Output encoding/decoding class:
```typescript
import { Encoder } from 'ts-binarifier/src/encoder'
import { Decoder } from 'ts-binarifier/src/decoder'
import type { MyType } from '/path/to/file/that/containts/MyType'

export class Gen {
    static encode(data: MyType): Uint8Array {
        const encoder = new Encoder()
        if (data.a < -2 || data.a > 1) throw new Error(`Number of value: ${data.a} does not fit into i2`)
        encoder.i8(data.a, 2)
        if (data.b < 0 || data.b > 3) throw new Error(`Number of value: ${data.b} does not fit into u2`)
        encoder.u8(data.b, 2)
        encoder.f32(data.c)
        if (data.d < 0 || data.d > 4294967295) throw new Error(`Number of value: ${data.d} does not fit into u32`)
        encoder.u32(data.d, 32)
        if (data.e < -2147483648 || data.e > 2147483647) throw new Error(`Number of value: ${data.e} does not fit into i32`)
        encoder.i32(data.e, 32)
        return encoder.getBuffer()
    }

    static decode(buf: Uint8Array): MyType {
        const decoder = new Decoder(buf)
        return {
            a: decoder.i(2),
            b: decoder.u(2),
            c: decoder.f32(),
            d: decoder.u32(),
            e: decoder.i32()
        }
    }
}
```

Test with:  
```bash
npm test
npm testWatch
```
