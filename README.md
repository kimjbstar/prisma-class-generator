**# Prisma Class Generator**

**## Prisma**

[Prisma](~~https://www.prisma.io/~~)is Database ORM Library for Node.js, Typescript.

Prisma basically has the function of generating each model defined in schema in type.

**## NestJS**

However, when we develop it, we may need a model defined as class.

In particular, when using NestJS using decorator patterns, the need increases.

For example, if the NestJS model is defined as class as below, it will be easier to apply swagger, TypeGraphQL, etc. through decorator.

```
export class Company {
    @ApiProperty() // swagger
    @Field(type => Int) // TypeGraphQL
    id: number

    @ApiProperty()
    name: string

    @ApiProperty()
    isUse: boolean
}
```

**### Hot it works?**

Prima internally defines metadata as a dmmf object.
Prisma-class-generator can automate class definition using this dmff.

**## Usage**

Suppose that two classes are declared in prisma.schema as below.

here is example of prisma.schema.

```
model Company {
    id            Int       @id @default(autoincrement())
    name      String    @db.VarChar(128)
    createdAt     DateTime  @default(now()) @db.DateTime(6)
    updatedAt     DateTime? @default(now()) @db.DateTime(6)
    deletedAt     DateTime? @db.DateTime(6)
}

model Account {
    id            Int       @id @default(autoincrement())
    bankName      String    @db.VarChar(128)
    accountNumber String    @db.VarChar(128)
    depositor     String    @db.VarChar(128)
    companyId     Int
    company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
    createdAt     DateTime  @default(now()) @db.DateTime(6)
    updatedAt     DateTime? @default(now()) @db.DateTime(6)
    deletedAt     DateTime? @db.DateTime(6)
}
```

get dmmf client and pass to 'writeFromDMMF'

```
import { PrismaClient } from '@prisma/client'
import { DMMFClass } from '@prisma/client/runtime'
import { writeFromDMMF } from 'prisma-class-generator'

// @ts-ignore
const dmmf: DMMFClass = new PrismaClient()._dmmf

writeFromDMMF({
    dmmf: dmmf as any,
    outputType: 'file',
    targetDir: <PATH DIRECTORY TO WRITE RESULT CLASSES>,
    useSwagger: true,
})
```

```
import { ApiProperty } from '@nestjs/swagger'

export class _Company {
    @ApiProperty({type:Number})
    id: number

    @ApiProperty({type:String})
    name: string

    @ApiProperty({type:Date})
    createdAt: Date

    @ApiProperty({type:Date})
    updatedAt: Date

    @ApiProperty({type:Date})
    deletedAt: Date

}
```

Company, Account 2 classes are created.
The reason why the class name has an underbar is to indicate that it has been automatically created.

```
import { _Company } from './company'
import { ApiProperty } from '@nestjs/swagger'

export class _Account {
    @ApiProperty({type:Number})
    id: number

    @ApiProperty({type:String})
    bankName: string

    @ApiProperty({type:String})
    accountNumber: string

    @ApiProperty({type:String})
    depositor: string

    @ApiProperty({type:Number})
    companyId: number

    @ApiProperty({type:() => _Company})
    company: _Company

    @ApiProperty({type:Date})
    createdAt: Date

    @ApiProperty({type:Date})
    updatedAt: Date

    @ApiProperty({type:Date})
    deletedAt: Date
}
```

**## Feature**

- Class generate ( default )
- swagger Decorator
- ~~TypeGraphQL ( To be supported later )~~
