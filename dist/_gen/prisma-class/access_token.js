"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._Access_token = void 0;
const user_1 = require("./user");
class _Access_token {
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
        this.token = obj.token;
    }
    get model() {
        return _Access_token.model;
    }
    static async fromId(id) {
        const dbModel = await _Access_token.model.findUnique({
            where: {
                id: id,
            },
        });
        if (dbModel === null)
            return null;
        return new _Access_token({
            ...dbModel,
            ...{ id: id },
        });
    }
}
exports._Access_token = _Access_token;
//# sourceMappingURL=access_token.js.map