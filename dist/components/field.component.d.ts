import { Echoable } from '../interfaces/echoable';
import { BaseComponent } from './base.component';
export declare class FieldComponent extends BaseComponent implements Echoable {
    name: string;
    nonNullableAssertion: boolean;
    nullable: boolean;
    useUndefinedDefault: boolean;
    default?: string;
    type?: string;
    echo: () => string;
    constructor(obj: {
        name: string;
        useUndefinedDefault: boolean;
    });
}
