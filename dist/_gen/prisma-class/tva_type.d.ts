import { _Product } from './product';
import { _Sub_order } from './sub_order';
import { Prisma } from '@prisma/client';
export declare class _TVA_type {
    static model: Prisma.TVA_typeDelegate<undefined>;
    id: number;
    slug?: string;
    protected _product: _Product[] | null;
    product(): Promise<_Product[] | null>;
    protected _sub_order: _Sub_order[] | null;
    sub_order(): Promise<_Sub_order[] | null>;
    constructor(obj: {
        slug?: string;
    });
    get model(): Prisma.TVA_typeDelegate<undefined>;
    static fromId(id: number): Promise<_TVA_type | null>;
}
