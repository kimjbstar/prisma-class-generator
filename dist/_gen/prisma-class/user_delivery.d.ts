import { _User } from './user';
import { Prisma } from '@prisma/client';
export declare class _User_delivery {
    static model: Prisma.User_deliveryDelegate<undefined>;
    id: number;
    user_id?: number;
    address?: string;
    additional_address?: string;
    zipcode?: string;
    city?: string;
    country?: string;
    region?: string;
    phone_number?: string;
    company_name?: string;
    protected _user: _User | null;
    user(): Promise<_User | null>;
    constructor(obj: {
        user_id?: number;
        address?: string;
        zipcode?: string;
        city?: string;
        country?: string;
        region?: string;
        phone_number?: string;
    });
    get model(): Prisma.User_deliveryDelegate<undefined>;
    static fromId(id: number): Promise<_User_delivery | null>;
}
