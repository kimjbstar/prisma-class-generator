import { _User } from './user';
import { Prisma } from '@prisma/client';
export declare class _Access_token {
    static model: Prisma.Access_tokenDelegate<undefined>;
    id: number;
    user_id?: number;
    token?: string;
    created_at?: number;
    expires_at?: number;
    protected _user: _User | null;
    user(): Promise<_User | null>;
    constructor(obj: {
        user_id?: number;
        token?: string;
    });
    get model(): Prisma.Access_tokenDelegate<undefined>;
    static fromId(id: number): Promise<_Access_token | null>;
}
