export const IDMODEL_TEMPLATE = `static async fromId(id: number): Promise<_#!{NAME} | null> {
  const dbModel = await _#!{NAME}.model.findUnique({
    where:{
      #!{FIELD_NAME}: id
    }
  });
  if(dbModel === null) return null
  return new _#!{NAME}({
    ...dbModel,
    ...{#!{FIELD_NAME}: id}
  });
}

`
