import { FileComponent } from './file.component';
import { ClassComponent } from './class.component';
export declare class PrismaModelComponent extends FileComponent {
    classes: ClassComponent[];
    constructor(output: string, classes: ClassComponent[]);
    echo: () => string;
}
