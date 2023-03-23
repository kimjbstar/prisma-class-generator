import { _User } from './user';
import { _Product } from './product';
import { Prisma } from '@prisma/client';
export declare class _Media {
    static model: Prisma.MediaDelegate<undefined>;
    id: number;
    slug?: string;
    url?: string;
    creation_date?: number;
    modification_date?: number;
    user_id?: number;
    protected _user: _User | null;
    user(): Promise<_User | null>;
    protected _product: _Product[] | null;
    product(): Promise<_Product[] | null>;
    constructor(obj: {
        slug?: string;
        url?: string;
        creation_date?: number;
        modification_date?: number;
        user_id?: number;
    });
    get model(): Prisma.MediaDelegate<undefined>;
    static fromId(id: number): Promise<_Media | null>;
}
