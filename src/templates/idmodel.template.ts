export const IDMODEL_TEMPLATE = `static async fromId(id: number): Promise<#!{NAME} | null> {
  const dbModel = await this.model.findUnique({
    where:{
      #!{FIELD_NAME}: id
    }
  });
  if(dbModel === null) return null
  return new #!{NAME}(dbModel);
}

`