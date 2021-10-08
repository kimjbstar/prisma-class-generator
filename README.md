# Prisma Class Generator

## **Prisma**

> [Prisma](https://www.prisma.io/) is Database ORM Library for Node.js, Typescript.

Prisma basically generate each models type definition defined in prisma.schema.
Therefore, it does not require additional entry classes or repository layers.

This is Prisma's basic way of doing things, and I love this approach.

However, there are limitations because of these characteristics.
A typical example is NestJS. In order to use @nestjs/swagger, the entity must be defined as class.

So I created a simple tool that generates a typescript file based on Prisma.schema.
This will reduce the effort to define classes directly while using the same single source of truth(schema.prisma)

## **NestJS**

> [NestJS](https://nestjs.com/) is a framework for building efficient, scalable Node.js server-side applications.

and also, this is one of the frameworks with class and decorator as the basic structure.

Let's think about it like this. if the NestJS model is defined as class as below, it will be easier to apply [swagger](https://docs.nestjs.com/openapi/introduction), [TypeGraphQL](https://typegraphql.com/), etc. through decorator.

And if the schema changes, redefine and create accordingly so that the schema and class syncs.

Using this library, it becomes possible.

```typescript
export class Company {
	@ApiProperty({ type: Number }) // swagger
	@Field((type) => Int) // TypeGraphQL
	id: number

	@ApiProperty({ type: String }) // swagger
	name: string

	@ApiProperty({ type: Boolean }) // swagger
	isUse: boolean
}
```

### **Usage**

1. **Install**

```shell
npm install prisma-class-generator -D
yarn add prisma-class-generator --dev
```

2. **Define Generator in prisma.schema**

```prisma
generator prismaClassGenerator {
    provider = "prisma-class-generator"
}
```

3. **😎 done! Let's check out generated files.**

if this models were defined in your prisma.schema file,

```prisma
model Product {
  id            Int         @id
  title         String      @db.VarChar(255)
  desc          String      @db.VarChar(1024)
  images        Json        @db.Json
  isShown       Boolean?    @default(false)
  stock         Int?        @default(0)
  type          ProductType
  averageRating Float?
  categoryId    Int
  companyId     Int
  category      Category    @relation(fields: [categoryId], references: [id])
  company       Company     @relation(fields: [companyId], references: [id])
  createdAt     DateTime    @default(now()) @db.Timestamp(6)
  updatedAt     DateTime    @updatedAt @db.Timestamp(6)
}

model Category {
  id       Int       @id
  products Product[]
}

model Company {
  id          Int       @id
  name        String
  totalIncome BigInt
  lat         Decimal
  lng         Decimal
  by          Bytes
  products    Product[]
}

```

then this class is generated in <PROJECT_PATH>/src/\_gen/prisma-class.

( The generating path can be customized through _output_ option. )

```typescript
// category.ts
import { Product } from './product'
import { ApiProperty } from '@nestjs/swagger'

export class Category {
	@ApiProperty({ type: Number })
	id: number

	@ApiProperty({ isArray: true, type: () => Product })
	products: Product
}
```

```typescript
// product.ts
import { Product } from './product'
import { ApiProperty } from '@nestjs/swagger'

export class Company {
	@ApiProperty({ type: Number })
	id: number

	@ApiProperty({ type: String })
	name: string

	@ApiProperty({ type: Bigint })
	totalIncome: bigint

	@ApiProperty({ type: Number })
	lat: number

	@ApiProperty({ type: Number })
	lng: number

	@ApiProperty({ type: Buffer })
	by: Buffer

	@ApiProperty({ isArray: true, type: () => Product })
	products: Product
}
```

```typescript
// category.ts
import { Category } from './category'
import { Company } from './company'
import { ProductType } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class Product {
	@ApiProperty({ type: Number })
	id: number

	@ApiProperty({ type: String })
	title: string

	@ApiProperty({ type: String })
	desc: string

	@ApiProperty()
	images: any

	@ApiProperty({ type: Boolean })
	isShown: boolean

	@ApiProperty({ type: Number })
	stock: number

	@ApiProperty({ enum: ProductType, enumName: 'ProductType' })
	type: ProductType

	@ApiProperty({ type: Number })
	averageRating: number

	@ApiProperty({ type: Number })
	categoryId: number

	@ApiProperty({ type: Number })
	companyId: number

	@ApiProperty({ type: () => Category })
	category: Category

	@ApiProperty({ type: () => Company })
	company: Company

	@ApiProperty({ type: Date })
	createdAt: Date

	@ApiProperty({ type: Date })
	updatedAt: Date
}
```

```typescript
// index.ts
import { Product as _Product } from './product'
import { Category as _Category } from './category'
import { Company as _Company } from './company'

export namespace PrismaModel {
	export class Product extends _Product {}
	export class Category extends _Category {}
	export class Company extends _Company {}

	export const extraModels = [Product, Category, Company]
}
```

The reason why classes were grouped into the 'PrismaModel' namespace and distributed in the index.ts file.

1. First, generated classes can overlap with the model types generated by Prisma, causing confusion.
2. when using Swagger in Nest.JS, you can use this array data in Bootstrap code to scan classes into @nestjs/swagger without having to list them.

There is a reference code for this below.

```typescript
// main.ts in Nest.JS application
import { PrismaModel } from './_gen/prisma-class'

const document = SwaggerModule.createDocument(app, options, {
	extraModels: [...PrismaModel.extraModels],
})
```

You can also disable it through the _makeIndexFile_ option.

3. **supported options**

    - _dryRun_
        - Decide whether to write file or just print result. default value is **true**
            - if you finished check result via terminal, then you should this options to **false**
    - _output_
        - sets output path. default is **'../src/\_gen/prisma-class'**
    - _useSwagger_
        - generates swggger decorator. default value is **true**
    - _makeIndexFile_
        - makes index file, default value is **true**

### **Hot it works?**

Prima internally defines metadata as a dmmf object.

[prisma-class-generator](https://github.com/kimjbstar/prisma-class-generator) can automate class definition using this dmmf.

It is defined as an additional generator in the "prisma.schema" file and will operate in the "prisma generate" process.

### **Feature**

-   generate Classes from prisma model definition
-   Support Basic Type and Relation
-   Support option to generate Swagger Decorator

### **Future Plan**

-   Considers all class-based things that are not limited to Nest.JS
-   Support all types in prisma.schema
-   Support TypeGraphQL
-   Support DTO
-   Support using user's own format like .prettierrc.json
-   Support custom path, case or name per each model

---

### **FAQ**

**1. Is it CRUD Generator?**

No. It will not provide functions such as "nestjs CRUD generate". I think it is outside the scope of this library.
Instead, it will only serve as a bridge connecting the Prisma model and (entity)class.

It will focus on **defining classes** and then give the developer responsibility on how to use them.

This is because if too much is provided, the library becomes less adaptable accordingly.

**2. Is only works with NestJS?**

No, but of course, it goes well with NestJS. I'm also planning to support the library related to NestJS.

But even if you don't use NestJS, this library will be useful for you if you use class decorator based on reflect-metadata to develop web services.
