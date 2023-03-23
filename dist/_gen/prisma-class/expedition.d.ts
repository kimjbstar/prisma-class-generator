import { _Sub_order } from './sub_order';
import { Prisma } from '@prisma/client';
export declare class _Expedition {
    static model: Prisma.ExpeditionDelegate<undefined>;
    id: number;
    name?: number;
    slug?: number;
    max_weight?: number;
    price?: number;
    protected _sub_order: _Sub_order[] | null;
    sub_order(): Promise<_Sub_order[] | null>;
    constructor(obj: {
        name?: number;
        slug?: number;
        max_weight?: number;
        price?: number;
    });
    get model(): Prisma.ExpeditionDelegate<undefined>;
    static fromId(id: number): Promise<_Expedition | null>;
}
