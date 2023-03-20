"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDMODEL_TEMPLATE = void 0;
exports.IDMODEL_TEMPLATE = `static async fromId(id: number): Promise<#!{NAME} | null> {
  const dbModel = await #!{NAME}.model.findUnique({
    where:{
      #!{FIELD_NAME}: id
    }
  });
  if(dbModel === null) return null
  return new #!{NAME}(dbModel);
}

`;
//# sourceMappingURL=idmodel.template.js.map