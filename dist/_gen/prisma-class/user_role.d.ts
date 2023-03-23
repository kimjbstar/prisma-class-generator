import { _User } from './user';
import { Prisma } from '@prisma/client';
export declare class _User_role {
    static model: Prisma.User_roleDelegate<undefined>;
    user_id: number;
    vendor_professional?: boolean;
    vendor_private?: boolean;
    buyer?: boolean;
    searcher?: boolean;
    admin?: boolean;
    protected _user: _User | null;
    user(): Promise<_User | null>;
    constructor(obj: {});
    get model(): Prisma.User_roleDelegate<undefined>;
    static fromId(id: number): Promise<_User_role | null>;
}
