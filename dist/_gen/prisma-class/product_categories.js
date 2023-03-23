"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Product_categories = void 0;
const product_category_1 = require("./product_category");
class _Product_categories {
    async product_category() {
        if (this._product_category === null) {
            const dbModels = await product_category_1._Product_category.model.findMany({
                where: {
                    category_id: this.id,
                },
            });
            if (dbModels.length) {
                this._product_category = [];
                for (const dbModel of dbModels)
                    this._product_category.push(new product_category_1._Product_category(dbModel));
            }
        }
        return this._product_category;
    }
    constructor(obj) {
        this.id = -1;
        this._product_category = null;
        this.category_name = obj.category_name;
        this.category_slug = obj.category_slug;
    }
    get model() {
        return _Product_categories.model;
    }
    static async fromId(id) {
        const dbModel = await _Product_categories.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Product_categories({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Product_categories = _Product_categories;
//# sourceMappingURL=product_categories.js.map