"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Sub_order = void 0;
const expedition_1 = require("./expedition");
const orders_1 = require("./orders");
const product_1 = require("./product");
const user_1 = require("./user");
const tva_type_1 = require("./tva_type");
class _Sub_order {
    async expedition() {
        if (this._expedition === null) {
            const dbModel = await expedition_1._Expedition.model.findUnique({
                where: {
                    id: this.expedition_id,
                },
            });
            if (dbModel !== null) {
                this._expedition = new expedition_1._Expedition(dbModel);
            }
        }
        return this._expedition;
    }
    async orders() {
        if (this._orders === null) {
            const dbModel = await orders_1._Orders.model.findUnique({
                where: {
                    id: this.order_id,
                },
            });
            if (dbModel !== null) {
                this._orders = new orders_1._Orders(dbModel);
            }
        }
        return this._orders;
    }
    async product() {
        if (this._product === null) {
            const dbModel = await product_1._Product.model.findUnique({
                where: {
                    id: this.product_id,
                },
            });
            if (dbModel !== null) {
                this._product = new product_1._Product(dbModel);
            }
        }
        return this._product;
    }
    async user() {
        if (this._user === null) {
            const dbModel = await user_1._User.model.findUnique({
                where: {
                    id: this.vendor_id,
                },
            });
            if (dbModel !== null) {
                this._user = new user_1._User(dbModel);
            }
        }
        return this._user;
    }
    async tva_type() {
        if (this._tva_type === null) {
            const dbModel = await tva_type_1._TVA_type.model.findUnique({
                where: {
                    id: this.taxe_id,
                },
            });
            if (dbModel !== null) {
                this._tva_type = new tva_type_1._TVA_type(dbModel);
            }
        }
        return this._tva_type;
    }
    constructor(obj) {
        this.id = -1;
        this._expedition = null;
        this._orders = null;
        this._product = null;
        this._user = null;
        this._tva_type = null;
        this.order_id = obj.order_id;
        this.vendor_id = obj.vendor_id;
        this.expedition_id = obj.expedition_id;
        this.product_id = obj.product_id;
        this.product_price = obj.product_price;
        this.quantity = obj.quantity;
        this.taxe_id = obj.taxe_id;
    }
    get model() {
        return _Sub_order.model;
    }
    static async fromId(id) {
        const dbModel = await _Sub_order.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Sub_order({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Sub_order = _Sub_order;
//# sourceMappingURL=sub_order.js.map