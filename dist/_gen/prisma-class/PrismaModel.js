"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaModel = exports._TVA_type = exports._Sub_order = exports._Product_visibilty = exports._Product_category = exports._Product_categories = exports._Product = exports._Orders = exports._Media = exports._Expedition = exports._User_role = exports._User_delivery = exports._User_billing = exports._User = exports._Access_token = void 0;
const client_1 = require("@prisma/client");
const access_token_1 = require("./access_token");
var access_token_2 = require("./access_token");
Object.defineProperty(exports, "_Access_token", { enumerable: true, get: function () { return access_token_2._Access_token; } });
const user_1 = require("./user");
var user_2 = require("./user");
Object.defineProperty(exports, "_User", { enumerable: true, get: function () { return user_2._User; } });
const user_billing_1 = require("./user_billing");
var user_billing_2 = require("./user_billing");
Object.defineProperty(exports, "_User_billing", { enumerable: true, get: function () { return user_billing_2._User_billing; } });
const user_delivery_1 = require("./user_delivery");
var user_delivery_2 = require("./user_delivery");
Object.defineProperty(exports, "_User_delivery", { enumerable: true, get: function () { return user_delivery_2._User_delivery; } });
const user_role_1 = require("./user_role");
var user_role_2 = require("./user_role");
Object.defineProperty(exports, "_User_role", { enumerable: true, get: function () { return user_role_2._User_role; } });
const expedition_1 = require("./expedition");
var expedition_2 = require("./expedition");
Object.defineProperty(exports, "_Expedition", { enumerable: true, get: function () { return expedition_2._Expedition; } });
const media_1 = require("./media");
var media_2 = require("./media");
Object.defineProperty(exports, "_Media", { enumerable: true, get: function () { return media_2._Media; } });
const orders_1 = require("./orders");
var orders_2 = require("./orders");
Object.defineProperty(exports, "_Orders", { enumerable: true, get: function () { return orders_2._Orders; } });
const product_1 = require("./product");
var product_2 = require("./product");
Object.defineProperty(exports, "_Product", { enumerable: true, get: function () { return product_2._Product; } });
const product_categories_1 = require("./product_categories");
var product_categories_2 = require("./product_categories");
Object.defineProperty(exports, "_Product_categories", { enumerable: true, get: function () { return product_categories_2._Product_categories; } });
const product_category_1 = require("./product_category");
var product_category_2 = require("./product_category");
Object.defineProperty(exports, "_Product_category", { enumerable: true, get: function () { return product_category_2._Product_category; } });
const product_visibilty_1 = require("./product_visibilty");
var product_visibilty_2 = require("./product_visibilty");
Object.defineProperty(exports, "_Product_visibilty", { enumerable: true, get: function () { return product_visibilty_2._Product_visibilty; } });
const sub_order_1 = require("./sub_order");
var sub_order_2 = require("./sub_order");
Object.defineProperty(exports, "_Sub_order", { enumerable: true, get: function () { return sub_order_2._Sub_order; } });
const tva_type_1 = require("./tva_type");
var tva_type_2 = require("./tva_type");
Object.defineProperty(exports, "_TVA_type", { enumerable: true, get: function () { return tva_type_2._TVA_type; } });
class PrismaModel {
    static async init() {
        BigInt.prototype.toJSON = () => {
            return this.toString();
        };
        if (PrismaModel.prisma === undefined) {
            PrismaModel.prisma = new client_1.PrismaClient();
            await PrismaModel.prisma.$connect();
            access_token_1._Access_token.model = PrismaModel.prisma.access_token;
            user_1._User.model = PrismaModel.prisma.user;
            user_billing_1._User_billing.model = PrismaModel.prisma.user_billing;
            user_delivery_1._User_delivery.model = PrismaModel.prisma.user_delivery;
            user_role_1._User_role.model = PrismaModel.prisma.user_role;
            expedition_1._Expedition.model = PrismaModel.prisma.expedition;
            media_1._Media.model = PrismaModel.prisma.media;
            orders_1._Orders.model = PrismaModel.prisma.orders;
            product_1._Product.model = PrismaModel.prisma.product;
            product_categories_1._Product_categories.model = PrismaModel.prisma.product_categories;
            product_category_1._Product_category.model = PrismaModel.prisma.product_category;
            product_visibilty_1._Product_visibilty.model = PrismaModel.prisma.product_visibilty;
            sub_order_1._Sub_order.model = PrismaModel.prisma.sub_order;
            tva_type_1._TVA_type.model = PrismaModel.prisma.tVA_type;
        }
    }
    static async destroy() {
        await PrismaModel.prisma.$disconnect();
    }
}
exports.PrismaModel = PrismaModel;
//# sourceMappingURL=PrismaModel.js.map