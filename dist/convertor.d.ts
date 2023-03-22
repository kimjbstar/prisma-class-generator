import { DMMF } from '@prisma/generator-helper';
import { ClassComponent } from './components/class.component';
import { FieldComponent } from './components/field.component';
type DefaultPrismaFieldType = 'BigInt' | 'Boolean' | 'Bytes' | 'DateTime' | 'Decimal' | 'Float' | 'Int' | 'Json' | 'String';
declare const primitiveMapType: Record<DefaultPrismaFieldType, string>;
export type PrimitiveMapTypeKeys = keyof typeof primitiveMapType;
export type PrimitiveMapTypeValues = typeof primitiveMapType[PrimitiveMapTypeKeys];
export interface ConvertModelInput {
    model: DMMF.Model;
    extractRelationFields?: boolean;
    postfix?: string;
    useGraphQL?: boolean;
}
export declare class PrismaConvertor {
    static instance: PrismaConvertor;
    private _config;
    private _dmmf;
    _classesRelations: {
        [key: string]: {
            relationFromFields?: string[];
            relationToFields?: string[];
            hasFieldForOne?: FieldComponent;
            justLinkedToMany?: FieldComponent;
            alsoHasFieldForOne?: FieldComponent;
            name?: string;
        };
    };
    get dmmf(): DMMF.Document;
    set dmmf(value: DMMF.Document);
    get config(): Partial<Record<"dryRun" | "separateRelationFields" | "useUndefinedDefault", any>>;
    set config(value: Partial<Record<"dryRun" | "separateRelationFields" | "useUndefinedDefault", any>>);
    static getInstance(): PrismaConvertor;
    getPrimitiveMapTypeFromDMMF: (dmmfField: DMMF.Field) => PrimitiveMapTypeValues;
    getClass: (input: ConvertModelInput) => ClassComponent;
    getClasses: () => ClassComponent[];
    convertField: (dmmfField: DMMF.Field) => FieldComponent;
}
export {};
