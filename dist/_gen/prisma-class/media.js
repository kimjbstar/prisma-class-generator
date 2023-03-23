"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Media = void 0;
const user_1 = require("./user");
const product_1 = require("./product");
class _Media {
    async user() {
        if (this._user === null) {
            const dbModel = await user_1._User.model.findUnique({
                where: {
                    id: this.user_id,
                },
            });
            if (dbModel !== null) {
                this._user = new user_1._User(dbModel);
            }
        }
        return this._user;
    }
    async product() {
        if (this._product === null) {
            const dbModels = await product_1._Product.model.findMany({
                where: {
                    product_image: this.id,
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
        this._user = null;
        this._product = null;
        this.slug = obj.slug;
        this.url = obj.url;
        this.creation_date = obj.creation_date;
        this.modification_date = obj.modification_date;
        this.user_id = obj.user_id;
    }
    get model() {
        return _Media.model;
    }
    static async fromId(id) {
        const dbModel = await _Media.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Media({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Media = _Media;
//# sourceMappingURL=media.js.map