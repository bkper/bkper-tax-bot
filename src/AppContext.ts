import { Bkper } from 'bkper-js';

interface HttpContext {
    get(key: string): any;
    set(key: string, value: any): void;
}

export class AppContext {

    private httpContext: HttpContext;

    public bkper: Bkper;

    constructor(httpContext: HttpContext, bkper: Bkper) {
        this.httpContext = httpContext;
        this.bkper = bkper;
    }

    get(key: string): any {
        return this.httpContext.get(key);
    }

    set(key: string, value: any): void {
        this.httpContext.set(key, value);
    }
}
