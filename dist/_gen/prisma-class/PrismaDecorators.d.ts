import 'reflect-metadata';
export declare class PrismaDecorators {
    static required<This, Args extends any[], Return>(value: any, context: ClassFieldDecoratorContext): any;
    static loggedMethod<This, Args extends any[], Return>(target: (this: This, ...args: Args) => Return, context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>): (this: This, ...args: Args) => Return;
}
