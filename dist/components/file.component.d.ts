import { ClassComponent } from './class.component';
import { Echoable } from '../interfaces/echoable';
import { ImportComponent } from './import.component';
export declare class FileComponent implements Echoable {
    private _dir?;
    private _filename?;
    private _imports?;
    private _prismaClass;
    static TEMP_PREFIX: string;
    get dir(): string;
    set dir(value: string);
    get filename(): string;
    set filename(value: string);
    get imports(): ImportComponent[];
    set imports(value: ImportComponent[]);
    get prismaClass(): ClassComponent;
    set prismaClass(value: ClassComponent);
    constructor(input: {
        classComponent: ClassComponent;
        output: string;
    });
    echoImports: () => string;
    echo: () => string;
    registerImport(item: string, from: string): void;
    resolveImports(): void;
    write(dryRun: boolean): void;
    getRelativePath(to: string): string;
    getPath(): string;
}
