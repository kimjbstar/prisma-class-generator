import { pascalCase, snakeCase } from "change-case";
import { ISwaggerOption, PrismaClass } from "./prismaToClass";
import { CLASS_TEMPLATE, FIELD_TEMPLATE, ROOT_TEMPLATE } from "./templates";

export interface IImport {
  exportedItems: string[];
  from: string;
}

export const getImportPhrase = (items: IImport[]) =>
  items
    .reduce((result, item) => {
      result.push(
        `import { ${item.exportedItems.join(",")} } from '${item.from}'`,
      );
      return result;
    }, [])
    .join("\r\n");

export const createClassContent = (
  pClass: PrismaClass,
  useSwagger = false,
): string => {
  // fields
  const fieldContent = pClass.fields.map((_field) =>
    FIELD_TEMPLATE.replace("#!{NAME}", _field.name)
      .replace("#!{TYPE}", _field.type)
      .replace(
        "#!{DECORATORS}",
        useSwagger ? swaggerOptionToTemplate(_field.swaggerOption) : "",
      ),
  );

  // imports
  const imports: IImport[] = [];
  pClass.relationTypes.forEach((relationClassName) => {
    imports.push({
      exportedItems: [`_${pascalCase(relationClassName)}`],
      from: relationClassName,
    });
  });
  pClass.enumTypes.forEach((enumName) => {
    imports.push({
      exportedItems: [enumName],
      from: "@prisma/client",
    });
  });
  if (useSwagger) {
    imports.push({
      exportedItems: ["ApiProperty"],
      from: "@nestjs/swagger",
    });
  }

  return CLASS_TEMPLATE.replace("#!{IMPORTS}", getImportPhrase(imports))
    .replace("#!{NAME}", `_${pClass.name}`)
    .replace("#!{FIELDS}", fieldContent.join("\r\n"));
};

export const createRootContent = (classes: PrismaClass[]) => {
  const imports: IImport[] = classes.map((_class) => ({
    exportedItems: [`_${pascalCase(_class.name)}`],
    from: snakeCase(_class.name),
  }));
  return ROOT_TEMPLATE.replace("#!{IMPORTS}", getImportPhrase(imports))
    .replace(
      "#!{CLASSES}",
      `${classes
        .map(
          (v) =>
            `export class ${pascalCase(v.name)} extends _${pascalCase(
              v.name,
            )} {}`,
        )
        .join(`\r\n`)}`,
    )
    .replace(
      "#!{CLASSE_NAMES}",
      `[${classes.map((v) => pascalCase(v.name)).join(`, `)}]`,
    );
};

export const swaggerOptionToTemplate = (input: ISwaggerOption): string => {
  const rows = Object.entries(input).reduce((result, [k, v]) => {
    result.push(`${k}:${v}`);
    return result;
  }, []);
  return `@ApiProperty({${rows.join(", ")}})`;
};
