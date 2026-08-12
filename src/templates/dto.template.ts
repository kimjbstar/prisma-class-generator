// A DTO class has no body of its own -- it's a composition of a generated model class with
// NestJS's mapped-type helpers, which carry both the Swagger metadata and the class-validator
// rules across (verified: OmitType keeps @IsString(), PartialType keeps it but makes it
// optional). Generating the composition rather than a fully expanded copy of every field means
// there is exactly one place a field's type/validators are declared.
export const DTO_CLASS_TEMPLATE = `#!{IMPORTS}

export class #!{NAME} extends #!{EXTENDS} {}
`
