import { PrismaClient } from '@prisma/client';
export { _Access_token } from './access_token';
export { _User } from './user';
export { _User_billing } from './user_billing';
export { _User_delivery } from './user_delivery';
export { _User_role } from './user_role';
export { _Expedition } from './expedition';
export { _Media } from './media';
export { _Orders } from './orders';
export { _Product } from './product';
export { _Product_categories } from './product_categories';
export { _Product_category } from './product_category';
export { _Product_visibilty } from './product_visibilty';
export { _Sub_order } from './sub_order';
export { _TVA_type } from './tva_type';
export declare abstract class PrismaModel {
    static prisma: PrismaClient;
    static init(): Promise<void>;
    static destroy(): Promise<void>;
}
