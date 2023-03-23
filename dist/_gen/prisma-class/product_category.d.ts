import { _Product_categories } from './product_categories';
import { _Product } from './product';
import { Prisma } from '@prisma/client';
export declare class _Product_category {
    static model: Prisma.Product_categoryDelegate<undefined>;
    product_id?: number;
    category_id?: number;
    protected _product_categories: _Product_categories | null;
    product_categories(): Promise<_Product_categories | null>;
    protected _product: _Product | null;
    product(): Promise<_Product | null>;
    constructor(obj: {
        product_id?: number;
        category_id?: number;
    });
    get model(): Prisma.Product_categoryDelegate<undefined>;
}
