import { Echoable } from '../interfaces/echoable';
export declare class DecoratorComponent implements Echoable {
    name: string;
    params: any[];
    importFrom: string;
    constructor(input: {
        name: string;
        params?: any | any[];
        importFrom: string;
    });
    echo(): string;
    add(param: any): void;
}
