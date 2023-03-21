import { FileComponent } from './file.component';
import { ClassComponent } from './class.component';
export declare class PrismaDecoComponent extends FileComponent {
    classes: ClassComponent[];
    constructor(output: string);
    echo: () => string;
}
