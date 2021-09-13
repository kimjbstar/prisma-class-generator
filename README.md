# Prisma Class Generator

## Prisma

[Prisma](~https://www.prisma.io/~)는 Node.js, Typescript 진영에서 사용되는 Database ORM 라이브러리 입니다.

Prisma에서는 기본적으로 schema에 정의된 각 모델을 type으로 generate해주는 기능이 있습니다.

## NestJS

다만 class로 정의되어 있는 모델이 필요한 경우도 있습니다. 특히 NestJS 등 decorator 패턴을 사용할 경우 더욱 그 필요성이 증가하게 됩니다.
예를 들어서 아래와 같이 NestJS 모델이 각각 class로 정의된다면, decorator를 통해 swagger, TypeGraphQL 등을 적용하기 용이해집니다.

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

### Hot it works?

Prisma는 내부적으로 metadata를 dmmf 객체에 담아 정의하는데, 이 데이터를 이용하여 Class definition을 자동화할 수 있는 툴입니다.

## Feature

- Class generate ( default )
- swagger Decorator
- ~~TypeGraphQL ( To be supported later )~~
