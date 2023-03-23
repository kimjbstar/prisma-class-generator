"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDMODEL_TEMPLATE = void 0;
exports.IDMODEL_TEMPLATE = `static async fromId(id: number): Promise<_#!{NAME} | null> {
  const dbModel = await _#!{NAME}.model.findUnique({
    where:{
      #!{FIELD_NAME}: id
    }
  });
  if(dbModel === null) return null
  return new _#!{NAME}(dbModel);
}

async save(): Promise<{
  status: true,
  type: "updated" | "created"
  id: number
} | {
  status: false
}> {
  if(this.#!{FIELD_NAME} < 0){
    if(
      #!{CHECK_REQUIRED}
    ){
      return {status: false}
    }
    
    const data = {
      #!{REQUIRED_FIELDS}
    }

    const user = await this.model.create({
      data: data
    })

    return {status: true, id: user.#!{FIELD_NAME}, type: "created"}
  }

  try{
    const data = {
      #!{REQUIRED_FIELDS}
    }
    
    const user = await this.model.update({
      where:{
        #!{FIELD_NAME}: this.#!{FIELD_NAME}
      },
      data: data
    })

    return {status: true, id: user.#!{FIELD_NAME}, type: "updated"}
  } catch (_){
    return {status: false}
  }


}
`;
//# sourceMappingURL=idmodel.template.js.map