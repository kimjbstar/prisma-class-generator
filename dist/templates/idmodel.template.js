"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDMODEL_TEMPLATE = void 0;
exports.IDMODEL_TEMPLATE = `
static async fromId(id: number):
#!{NAME} {
  const dbModel = await this.model.findUnique({
    where:{
#!{FIELD_NAME}: id
    }
  });
}

`;
//# sourceMappingURL=idmodel.template.js.map