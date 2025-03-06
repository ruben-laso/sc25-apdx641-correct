export declare class Cache {
    dir: string;
    constructor(dir: string);
    set(key: string, value: string): Promise<string | null | undefined>;
    get(key: string): Promise<string | null>;
    remove(key: string): Promise<void>;
}
