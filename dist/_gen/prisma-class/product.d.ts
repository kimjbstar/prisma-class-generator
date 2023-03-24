import { _Media } from './media';
import { _Product_visibilty } from './product_visibilty';
import { _TVA_type } from './tva_type';
import { _User } from './user';
import { _Product_category } from './product_category';
import { _Sub_order } from './sub_order';
import { Prisma } from '@prisma/client';
export declare class _Product {
    static model: Prisma.ProductDelegate<undefined>;
    id: number;
    vendor_id?: number;
    state?: number;
    tva?: number;
    product_name?: string;
    vendor_sku?: string;
    product_sku?: string;
    price?: number;
    price_promo?: number;
    description?: string;
    additional_description?: string;
    backorder?: boolean;
    unique_product?: boolean;
    linked_products?: string;
    product_image?: number;
    product_image_gallery?: string;
    product_state?: number;
    product_keywords?: string;
    creation_date?: number;
    modification_date?: number;
    has_tva?: boolean;
    protected _media: _Media | null;
    media(): Promise<_Media | null>;
    protected _product_visibilty: _Product_visibilty | null;
    product_visibilty(): Promise<_Product_visibilty | null>;
    protected _tva_type: _TVA_type | null;
    tva_type(): Promise<_TVA_type | null>;
    protected _user: _User | null;
    user(): Promise<_User | null>;
    protected _product_category: _Product_category[] | null;
    product_category(): Promise<_Product_category[] | null>;
    protected _sub_order: _Sub_order[] | null;
    sub_order(): Promise<_Sub_order[] | null>;
    constructor(obj: {
        vendor_id?: number;
        state?: number;
        tva?: number;
        product_name?: string;
        vendor_sku?: string;
        product_sku?: string;
        price?: number;
        price_promo?: number;
        description?: string;
        backorder?: boolean;
        unique_product?: boolean;
        linked_products?: string;
        product_image?: number;
        product_state?: number;
        product_keywords?: string;
        creation_date?: number;
        modification_date?: number;
        has_tva?: boolean;
    });
    get model(): Prisma.ProductDelegate<undefined>;
    static fromId(id: number): Promise<_Product | null>;
}