# Prisma Class Generator

### Prisma

[Prisma](https://www.prisma.io/) is Database ORM Library for Node.js, Typescript.

Prisma basically has the function of generating each model defined in schema in type.

### [NestJS](https://nestjs.com/)

However, when we develop it, we may need a model defined as class.

In particular, when using NestJS using decorator patterns, the need increases.

For example, if the NestJS model is defined as class as below, it will be easier to apply [swagger](https://docs.nestjs.com/openapi/introduction), [TypeGraphQL](https://typegraphql.com/), etc. through decorator.

```typescript
export class Company {
	@ApiProperty() // swagger
	@Field((type) => Int) // TypeGraphQL
	id: number

	@ApiProperty()
	name: string

	@ApiProperty()
	isUse: boolean
}
```

### Hot it works?

Prima internally defines metadata as a dmmf object.
[prisma-class-generator](https://github.com/kimjbstar/prisma-class-generator) can automate class definition using this dmmf.

### Usage

wip

### Feature

(default)Generating Class

-   Support Basic Type and Relation

Swagger Decorator

TypeGraphQL ( To be supported later )
