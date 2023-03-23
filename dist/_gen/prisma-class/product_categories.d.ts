import { _Product_category } from './product_category';
import { Prisma } from '@prisma/client';
export declare class _Product_categories {
    static model: Prisma.Product_categoriesDelegate<undefined>;
    id: number;
    category_name?: string;
    category_slug?: string;
    protected _product_category: _Product_category[] | null;
    product_category(): Promise<_Product_category[] | null>;
    constructor(obj: {
        category_name?: string;
        category_slug?: string;
    });
    get model(): Prisma.Product_categoriesDelegate<undefined>;
    static fromId(id: number): Promise<_Product_categories | null>;
}
