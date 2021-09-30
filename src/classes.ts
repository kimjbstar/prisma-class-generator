import { CLASS_TEMPLATE, FIELD_TEMPLATE } from "./templates";

export interface IDecorator {
  name: string;
  params: any[];
}

export type ISwaggerOption = Record<string, any>;

export class Decoratable {
  decorators?: IDecorator[] = [];

  constructor(obj?: object) {
    Object.assign(this, obj);
  }

  setDecoratorObjectValue = (input: {
    name: string;
    param: { key: string; value: any };
  }): void => {
    const { name, param } = input;
    const oldDecorator = this.decorators.find((v) => v.name === name);
    if (oldDecorator) {
      oldDecorator.params.push({
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

  echoDecorators() {
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
  }
}

export class PrismaField extends Decoratable {
  name: string;
  type?: any;

  echo() {
    return FIELD_TEMPLATE.replace("#!{NAME}", this.name)
      .replace("#!{TYPE}", this.type)
      .replace("#!{DECORATORS}", this.echoDecorators());
  }

  constructor(obj) {
    super(obj);
  }
}

export class PrismaClass extends Decoratable {
  name: string;
  fields?: PrismaField[];
  relationTypes?: string[];
  enumTypes?: string[];

  echo() {
    const fieldContent = this.fields.map((_field) => _field.echo());
    return CLASS_TEMPLATE.replace("#!{NAME}", `${this.name}`).replace(
      "#!{FIELDS}",
      fieldContent.join("\r\n"),
    );
  }
}

export interface PrismaClassGeneratorOptions {
  foo: string;
  bar: string;
  useSwagger: boolean;
  dryRun: boolean;
}
