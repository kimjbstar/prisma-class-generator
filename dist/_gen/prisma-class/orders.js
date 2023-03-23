"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Orders = void 0;
const sub_order_1 = require("./sub_order");
class _Orders {
    async sub_order() {
        if (this._sub_order === null) {
            const dbModels = await sub_order_1._Sub_order.model.findMany({
                where: {
                    order_id: this.id,
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
    constructor(obj) {
        this.id = -1;
        this._sub_order = null;
        this.order_client_id = obj.order_client_id;
        this.creation_date = obj.creation_date;
        this.modification_date = obj.modification_date;
        this.order_state = obj.order_state;
        this.type = obj.type;
        this.buyer_id = obj.buyer_id;
        this.buyer_billing_id = obj.buyer_billing_id;
        this.buyer_delivery_id = obj.buyer_delivery_id;
        this.expedition_id = obj.expedition_id;
        this.order_total = obj.order_total;
    }
    get model() {
        return _Orders.model;
    }
    static async fromId(id) {
        const dbModel = await _Orders.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Orders({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Orders = _Orders;
//# sourceMappingURL=orders.js.map