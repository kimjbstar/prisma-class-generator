"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._User_billing = void 0;
const user_1 = require("./user");
class _User_billing {
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
    constructor(obj) {
        this.id = -1;
        this._user = null;
        this.user_id = obj.user_id;
        this.address = obj.address;
        this.zipcode = obj.zipcode;
        this.city = obj.city;
        this.country = obj.country;
        this.region = obj.region;
        this.phone_number = obj.phone_number;
    }
    get model() {
        return _User_billing.model;
    }
    static async fromId(id) {
        const dbModel = await _User_billing.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _User_billing({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._User_billing = _User_billing;
//# sourceMappingURL=user_billing.js.map