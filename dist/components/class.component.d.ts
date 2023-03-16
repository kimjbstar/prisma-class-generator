import { Echoable } from '../interfaces/echoable';
import { FieldComponent } from './field.component';
import { BaseComponent } from './base.component';
export declare class ClassComponent extends BaseComponent implements Echoable {
    name: string;
    fields?: FieldComponent[];
    relationTypes?: string[];
    enumTypes?: string[];
    extra?: string;
    echo: () => string;
    reExportPrefixed: (prefix: string) => string;
}
