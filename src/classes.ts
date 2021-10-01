import { pascalCase } from "change-case";
import { CLASS_TEMPLATE, FIELD_TEMPLATE } from "./templates";

export interface IDecorator {
  name: string;
  params: any[];
}

export class Decoratable {
  decorators?: IDecorator[] = [];

  constructor(obj?: object) {
    Object.assign(this, obj);
  }

  addDecorator = (input: { name: string; param: any }): void => {
    const { name, param } = input;
    const oldIndex = this.decorators.findIndex((v) => v.name === name);
    if (oldIndex > -1) {
      this.decorators[oldIndex].params.push({
        value: param,
      });
      return;
    }
    const decorator: IDecorator = {
      name: name,
      params: [param],
    };
    this.decorators.push(decorator);
    return;
  };

  echoDecorators = () => {
    const lines = this.decorators.map((decorator) => {
      const content = decorator.params.reduce((result, param) => {
        if (typeof param === "object") {
          result.push(
            `{${Object.entries(param)
              .map(([k, v]) => `${k}:${v}`)
              .join(",")}}`,
          );
        } else {
          result.push(param);
        }
        return result;
      }, []);
      return `@${decorator.name}(${content.join(", ")})`;
    });
    return lines.join("\r\n");
  };
}

export class PrismaField extends Decoratable {
  name: string;
  type?: any;

  echo = () => {
    return FIELD_TEMPLATE.replace("#!{NAME}", this.name)
      .replace("#!{TYPE}", this.type)
      .replace("#!{DECORATORS}", this.echoDecorators());
  };

  constructor(obj) {
    super(obj);
  }
}

export class PrismaClass extends Decoratable {
  name: string;
  fields?: PrismaField[];
  relationTypes?: string[];
  enumTypes?: string[];

  echo = () => {
    const fieldContent = this.fields.map((_field) => _field.echo());
    return CLASS_TEMPLATE.replace("#!{NAME}", `${this.name}`).replace(
      "#!{FIELDS}",
      fieldContent.join("\r\n"),
    );
  };
}

export interface IImport {
  exportedItems: string[];
  from: string;
}

export class PrismaClassFile {
  dir?: string;
  fileName?: string;
  imports?: IImport[] = [];
  prismaClass: PrismaClass;

  constructor(prismaClass: PrismaClass) {
    this.prismaClass = prismaClass;
    this.addDefaultImports();
  }

  static echoImports = (items: IImport[]) =>
    items
      .reduce((result, item) => {
        result.push(
          `import { ${item.exportedItems.join(",")} } from '${item.from}'`,
        );
        return result;
      }, [])
      .join("\r\n");

  echo = () => {
    return this.prismaClass
      .echo()
      .replace("#!{IMPORTS}", PrismaClassFile.echoImports(this.imports));
  };

  addImport(exportedItem: string, from: string) {
    const oldIndex = this.imports.findIndex((_import) => _import.from === from);
    if (oldIndex > -1) {
      if (
        this.imports[oldIndex].exportedItems.includes(exportedItem) === false
      ) {
        this.imports[oldIndex].exportedItems.push(exportedItem);
      }
      return;
    }
    this.imports.push({
      exportedItems: [exportedItem],
      from: from,
    });
  }

  addDefaultImports() {
    this.prismaClass.relationTypes.forEach((relationClassName) => {
      this.addImport(`${pascalCase(relationClassName)}`, relationClassName);
    });
    this.prismaClass.enumTypes.forEach((enumName) => {
      this.addImport(enumName, "@prisma/client");
    });

    const apiPropertyDecorator = this.prismaClass.decorators.find(
      (decorator) => decorator.name === "ApiProperty",
    );
    if (apiPropertyDecorator) {
      this.addImport("ApiProperty", "@nestjs/swagger");
    }
  }
}
