import { DecoratorComponent } from './decorator.component';
export declare class BaseComponent {
    decorators: DecoratorComponent[];
    constructor(obj?: object);
    echoDecorators: () => string;
}
