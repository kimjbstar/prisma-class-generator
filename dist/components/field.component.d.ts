import { Echoable } from '../interfaces/echoable';
import { BaseComponent } from './base.component';
export declare class FieldComponent extends BaseComponent implements Echoable {
    name: string;
    nullable: boolean;
    useUndefinedDefault: boolean;
    isId: boolean;
    relation?: {
        hasFieldForOne?: FieldComponent;
        justLinkedToMany?: FieldComponent;
        relationFromFields?: string[];
        relationToFields?: string[];
        name?: string;
    };
    default?: string;
    type?: string;
    echo: () => string;
    constructor(obj: {
        name: string;
        useUndefinedDefault: boolean;
        isId: boolean;
    });
}
