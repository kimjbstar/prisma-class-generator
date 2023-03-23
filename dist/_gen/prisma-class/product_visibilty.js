"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Product_visibilty = void 0;
const product_1 = require("./product");
class _Product_visibilty {
    async product() {
        if (this._product === null) {
            const dbModels = await product_1._Product.model.findMany({
                where: {
                    state: this.id,
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
    constructor(obj) {
        this.id = -1;
        this._product = null;
        this.state = obj.state;
    }
    get model() {
        return _Product_visibilty.model;
    }
    static async fromId(id) {
        const dbModel = await _Product_visibilty.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Product_visibilty({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Product_visibilty = _Product_visibilty;
//# sourceMappingURL=product_visibilty.js.map