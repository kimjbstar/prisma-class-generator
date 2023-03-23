"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Expedition = void 0;
const sub_order_1 = require("./sub_order");
class _Expedition {
    async sub_order() {
        if (this._sub_order === null) {
            const dbModels = await sub_order_1._Sub_order.model.findMany({
                where: {
                    expedition_id: this.id,
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
        this.name = obj.name;
        this.slug = obj.slug;
        this.max_weight = obj.max_weight;
        this.price = obj.price;
    }
    get model() {
        return _Expedition.model;
    }
    static async fromId(id) {
        const dbModel = await _Expedition.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Expedition({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Expedition = _Expedition;
//# sourceMappingURL=expedition.js.map