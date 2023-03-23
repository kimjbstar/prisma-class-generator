import { _Expedition } from './expedition';
import { _Orders } from './orders';
import { _Product } from './product';
import { _User } from './user';
import { _TVA_type } from './tva_type';
import { Prisma } from '@prisma/client';
export declare class _Sub_order {
    static model: Prisma.Sub_orderDelegate<undefined>;
    id: number;
    order_id?: number;
    vendor_id?: number;
    expedition_id?: number;
    product_id?: number;
    product_price?: number;
    quantity?: number;
    taxe_id?: number;
    protected _expedition: _Expedition | null;
    expedition(): Promise<_Expedition | null>;
    protected _orders: _Orders | null;
    orders(): Promise<_Orders | null>;
    protected _product: _Product | null;
    product(): Promise<_Product | null>;
    protected _user: _User | null;
    user(): Promise<_User | null>;
    protected _tva_type: _TVA_type | null;
    tva_type(): Promise<_TVA_type | null>;
    constructor(obj: {
        order_id?: number;
        vendor_id?: number;
        expedition_id?: number;
        product_id?: number;
        product_price?: number;
        quantity?: number;
        taxe_id?: number;
    });
    get model(): Prisma.Sub_orderDelegate<undefined>;
    static fromId(id: number): Promise<_Sub_order | null>;
}
