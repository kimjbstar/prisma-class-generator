# Prisma Class Generator

## Prisma

[Prisma](~https://www.prisma.io/~)는 Node.js, Typescript 진영에서 사용되는 Database ORM 라이브러리 입니다.

Prisma에서는 기본적으로 schema에 정의된 각 모델을 type으로는 generate해주는 기능이 있습니다. 그러나 class로 정의되어 있는 모델이 필요한 경우도 있습니다.

## NestJS

특히 NestJS 등 decorator 패턴을 사용할 경우 더욱 그 필요성이 증가하게 됩니다.
예를 들어서 아래외 같이 NestJS 모델이 class로 정의 될경우 decorator를 통해 swagger, TypeGraphQL 등을 용이하게 사용할 수 있습니다.

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

등에서 용이하게 사용할 수있습니다.

### Hot it works?

Prisma는 내부적으로 metadata를 dmmf 객체에 담아 정의하는데, 이 데이터를 이용해서 Class definition을 간단하게 생성해주는 툴을 만들었습니다.

## Feature

- Class generate ( default )
- swagger Decorator
- ~~TypeGraphQL ( To be supported later )~~
