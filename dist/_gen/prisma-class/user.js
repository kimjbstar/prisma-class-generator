"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._User = void 0;
const access_token_1 = require("./access_token");
const media_1 = require("./media");
const product_1 = require("./product");
const sub_order_1 = require("./sub_order");
const user_billing_1 = require("./user_billing");
const user_delivery_1 = require("./user_delivery");
const user_role_1 = require("./user_role");
class _User {
    async access_token() {
        if (this._access_token === null) {
            const dbModels = await access_token_1._Access_token.model.findMany({
                where: {
                    user_id: this.id,
                },
            });
            if (dbModels.length) {
                this._access_token = [];
                for (const dbModel of dbModels)
                    this._access_token.push(new access_token_1._Access_token(dbModel));
            }
        }
        return this._access_token;
    }
    async media() {
        if (this._media === null) {
            const dbModels = await media_1._Media.model.findMany({
                where: {
                    user_id: this.id,
                },
            });
            if (dbModels.length) {
                this._media = [];
                for (const dbModel of dbModels)
                    this._media.push(new media_1._Media(dbModel));
            }
        }
        return this._media;
    }
    async product() {
        if (this._product === null) {
            const dbModels = await product_1._Product.model.findMany({
                where: {
                    vendor_id: this.id,
                },
            });
            if (dbModels.length) {
                this._product = [];
                for (const dbModel of dbModels)
                    this._product.push(new product_1._Product(dbModel));
            }
        }
        return this._product;
    }
    async sub_order() {
        if (this._sub_order === null) {
            const dbModels = await sub_order_1._Sub_order.model.findMany({
                where: {
                    vendor_id: this.id,
                },
            });
            if (dbModels.length) {
                this._sub_order = [];
                for (const dbModel of dbModels)
                    this._sub_order.push(new sub_order_1._Sub_order(dbModel));
            }
        }
        return this._sub_order;
    }
    async user_billing() {
        if (this._user_billing === null) {
            const dbModels = await user_billing_1._User_billing.model.findMany({
                where: {
                    user_id: this.id,
                },
            });
            if (dbModels.length) {
                this._user_billing = [];
                for (const dbModel of dbModels)
                    this._user_billing.push(new user_billing_1._User_billing(dbModel));
            }
        }
        return this._user_billing;
    }
    async user_delivery() {
        if (this._user_delivery === null) {
            const dbModels = await user_delivery_1._User_delivery.model.findMany({
                where: {
                    user_id: this.id,
                },
            });
            if (dbModels.length) {
                this._user_delivery = [];
                for (const dbModel of dbModels)
                    this._user_delivery.push(new user_delivery_1._User_delivery(dbModel));
            }
        }
        return this._user_delivery;
    }
    async user_role() {
        if (this._user_role === null) {
            const dbModel = await user_role_1._User_role.model.findUnique({
                where: {
                    user_id: this.id,
                },
            });
            if (dbModel !== null) {
                this._user_role = new user_role_1._User_role(dbModel);
            }
        }
        return this._user_role;
    }
    constructor(obj) {
        this.id = -1;
        this.user_registered = false;
        this._access_token = null;
        this._media = null;
        this._product = null;
        this._sub_order = null;
        this._user_billing = null;
        this._user_delivery = null;
        this._user_role = null;
        this.user_login = obj.user_login;
        this.user_pass = obj.user_pass;
        this.user_email = obj.user_email;
        this.firstname = obj.firstname;
        this.lastname = obj.lastname;
        this.birthdate = obj.birthdate;
        this.token = obj.token;
    }
    get model() {
        return _User.model;
    }
    static async fromId(id) {
        const dbModel = await _User.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _User({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._User = _User;
//# sourceMappingURL=user.js.map