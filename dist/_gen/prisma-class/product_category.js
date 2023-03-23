"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Product_category = void 0;
const product_categories_1 = require("./product_categories");
const product_1 = require("./product");
class _Product_category {
    async product_categories() {
        if (this._product_categories === null) {
            const dbModel = await product_categories_1._Product_categories.model.findUnique({
                where: {
                    id: this.category_id,
                },
            });
            if (dbModel !== null) {
                this._product_categories = new product_categories_1._Product_categories(dbModel);
            }
        }
        return this._product_categories;
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
    constructor(obj) {
        this._product_categories = null;
        this._product = null;
        this.product_id = obj.product_id;
        this.category_id = obj.category_id;
    }
    get model() {
        return _Product_category.model;
    }
}
exports._Product_category = _Product_category;
//# sourceMappingURL=product_category.js.map