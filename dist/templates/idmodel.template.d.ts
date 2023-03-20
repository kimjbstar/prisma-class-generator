export declare const IDMODEL_TEMPLATE = "\nstatic async fromId(id: number):\n#!{NAME} {\n  const dbModel = await this.model.findUnique({\n    where:{\n#!{FIELD_NAME}: id\n    }\n  });\n}\n\n";
