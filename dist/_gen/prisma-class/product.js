"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Product = void 0;
const media_1 = require("./media");
const product_visibilty_1 = require("./product_visibilty");
const tva_type_1 = require("./tva_type");
const user_1 = require("./user");
const product_category_1 = require("./product_category");
const sub_order_1 = require("./sub_order");
class _Product {
    async media() {
        if (this._media === null) {
            const dbModel = await media_1._Media.model.findUnique({
                where: {
                    id: this.product_image,
                },
            });
            if (dbModel !== null) {
                this._media = new media_1._Media(dbModel);
            }
        }
        return this._media;
    }
    async product_visibilty() {
        if (this._product_visibilty === null) {
            const dbModel = await product_visibilty_1._Product_visibilty.model.findUnique({
                where: {
                    id: this.state,
                },
            });
            if (dbModel !== null) {
                this._product_visibilty = new product_visibilty_1._Product_visibilty(dbModel);
            }
        }
        return this._product_visibilty;
    }
    async tva_type() {
        if (this._tva_type === null) {
            const dbModel = await tva_type_1._TVA_type.model.findUnique({
                where: {
                    id: this.tva,
                },
            });
            if (dbModel !== null) {
                this._tva_type = new tva_type_1._TVA_type(dbModel);
            }
        }
        return this._tva_type;
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
    async product_category() {
        if (this._product_category === null) {
            const dbModels = await product_category_1._Product_category.model.findMany({
                where: {
                    product_id: this.id,
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
    async sub_order() {
        if (this._sub_order === null) {
            const dbModels = await sub_order_1._Sub_order.model.findMany({
                where: {
                    product_id: this.id,
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
        this._media = null;
        this._product_visibilty = null;
        this._tva_type = null;
        this._user = null;
        this._product_category = null;
        this._sub_order = null;
        this.vendor_id = obj.vendor_id;
        this.state = obj.state;
        this.tva = obj.tva;
        this.product_name = obj.product_name;
        this.vendor_sku = obj.vendor_sku;
        this.product_sku = obj.product_sku;
        this.price = obj.price;
        this.price_promo = obj.price_promo;
        this.description = obj.description;
        this.backorder = obj.backorder;
        this.unique_product = obj.unique_product;
        this.linked_products = obj.linked_products;
        this.product_image = obj.product_image;
        this.product_state = obj.product_state;
        this.product_keywords = obj.product_keywords;
        this.creation_date = obj.creation_date;
        this.modification_date = obj.modification_date;
        this.has_tva = obj.has_tva;
    }
    get model() {
        return _Product.model;
    }
    static async fromId(id) {
        const dbModel = await _Product.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Product({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Product = _Product;
//# sourceMappingURL=product.js.map