import { pascalCase, snakeCase } from "change-case";
import { PrismaClass } from "./classes";

import { ROOT_TEMPLATE } from "./templates";
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

export const echoClassContent = (
  pClass: PrismaClass,
  useSwagger = false,
): string => {
  const imports: IImport[] = [];
  pClass.relationTypes.forEach((relationClassName) => {
    imports.push({
      exportedItems: [`${pascalCase(relationClassName)}`],
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
  console.log(imports);

  return pClass.echo().replace("#!{IMPORTS}", getImportPhrase(imports));
};

// export const createRootContent = (classes: PrismaClass[]) => {
//   const imports: IImport[] = classes.map((_class) => ({
//     exportedItems: [`${pascalCase(_class.name)}`],
//     from: snakeCase(_class.name),
//   }));
//   return ROOT_TEMPLATE.replace("#!{IMPORTS}", getImportPhrase(imports))
//     .replace(
//       "#!{CLASSES}",
//       `${classes
//         .map(
//           (v) =>
//             `export class ${pascalCase(v.name)} extends ${pascalCase(
//               v.name,
//             )} {}`,
//         )
//         .join(`\r\n`)}`,
//     )
//     .replace(
//       "#!{CLASSE_NAMES}",
//       `[${classes.map((v) => pascalCase(v.name)).join(`, `)}]`,
//     );
// };
