import PocketBase, { RecordSubscription, SendOptions, UnsubscribeFunc, ListResult, RecordService, RecordAuthResponse, OAuth2AuthConfig, RecordOptions } from 'pocketbase';

type Prettify<T> = T extends infer o ? {
    [K in keyof o]: o[K];
} : never;
type MaybeArray<T> = T | T[];
type MaybeMakeArray<T, Out> = T extends any[] ? Out[] : Out;
type ArrayInnerType<T> = T extends Array<infer V> ? V : T;
type Values<T> = T[keyof T];
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;
type BaseRecord = Record<string, any>;
type GenericCollection = {
    type: string;
    collectionId: string;
    collectionName: string;
    response: BaseRecord;
    create?: BaseRecord;
    update?: BaseRecord;
    relations: Record<string, GenericCollection | GenericCollection[]>;
};
type GenericSchema = {
    [K: string]: GenericCollection;
};
type TypedRecord<Data extends BaseRecord, Expand extends GenericExpand = {}> = Data & {
    expand: Expand;
};
type GenericExpand = Record<string, TypedRecord<any> | TypedRecord<any>[]>;
type JoinPath<Parts extends string[]> = Parts extends [
    infer A extends string,
    ...infer Rest extends string[]
] ? Rest['length'] extends 0 ? A : `${A}.${JoinPath<Rest>}` : never;
type _RecordWithExpandToDotPath<T extends GenericCollection, Path extends string[] = []> = {
    [K in keyof T['response'] as JoinPath<[
        ...Path,
        K & string
    ]>]: T['response'][K];
} & (Path['length'] extends 4 ? {} : UnionToIntersection<Values<{
    [K in keyof T['relations']]: _RecordWithExpandToDotPath<ArrayInnerType<T['relations'][K]>, [
        ...Path,
        K & string
    ]>;
}>>);
type RecordWithExpandToDotPath<T extends GenericCollection> = Prettify<_RecordWithExpandToDotPath<T>>;

type Select<Collection extends GenericCollection> = {
    [K in keyof Collection['response']]?: boolean;
};
type SelectWithExpand<Collection extends GenericCollection> = Select<Collection> & {
    expand?: {
        [K in keyof Collection['relations']]?: SelectWithExpand<ArrayInnerType<Collection['relations'][K]>> | boolean;
    };
};
type ResolveSelect<TCollection extends GenericCollection, TSelect extends Select<TCollection> | undefined> = Extract<keyof TSelect, keyof TCollection['response']> extends never ? TCollection['response'] : {
    [K in keyof TSelect & keyof TCollection['response'] as TSelect[K] extends true ? K : never]: TCollection['response'][K];
};
type ResolveSelectWithExpand<TCollection extends GenericCollection, TSelect extends Select<TCollection> | undefined> = Prettify<ResolveSelect<TCollection, TSelect> & ('expand' extends keyof TSelect ? {
    expand?: {
        [Relation in keyof TSelect['expand'] & keyof TCollection['relations'] as TSelect['expand'][Relation] extends false ? never : Relation]?: TSelect['expand'][Relation] extends true ? MaybeMakeArray<TCollection['relations'][Relation], ArrayInnerType<TCollection['relations'][Relation]>['response']> : TSelect['expand'][Relation] extends object ? MaybeMakeArray<TCollection['relations'][Relation], ResolveSelectWithExpand<ArrayInnerType<TCollection['relations'][Relation]>, TSelect['expand'][Relation]>> : never;
    };
} : {})>;

type ActualFilter<T extends any, K extends keyof T = keyof T> = [
    K,
    FilterOperand,
    T[K]
];
type FilterOperand = '=' | '!=' | '>' | '>=' | '<' | '<=' | '~' | '!~' | '?=' | '?!=' | '?>' | '?>=' | '?<' | '?<=' | '?~' | '?!~';
type FilterParam<T extends BaseRecord> = {
    __record__?: T;
} & string;
type Filter<T extends BaseRecord> = ActualFilter<T> | FilterParam<T> | false | null | undefined;
declare function and<T extends BaseRecord>(...filters: Filter<T>[]): FilterParam<T>;
declare function or<T extends BaseRecord>(...filters: Filter<T>[]): FilterParam<T>;
declare function eq<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function neq<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function gt<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function gte<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function lt<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function lte<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function like<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;
declare function nlike<T extends BaseRecord, Key extends keyof T>(column: Key, value: T[Key]): FilterParam<T>;

type Sort<T extends BaseRecord> = `${'+' | '-'}${keyof T & string}` | false | null | undefined;

interface ViewCollectionService<Collection extends GenericCollection, ExpandedRecord extends BaseRecord = RecordWithExpandToDotPath<Collection>> {
    collectionName: Collection['collectionName'];
    client: PocketBase;
    subscribe<TSelect extends SelectWithExpand<Collection> | {}>(topic: string, callback: (data: RecordSubscription<ResolveSelectWithExpand<Collection, TSelect>>) => void, options?: {
        select?: TSelect;
    } & SendOptions): Promise<UnsubscribeFunc>;
    getFullList<TSelect extends SelectWithExpand<Collection> | {}>(options?: {
        select?: TSelect;
        page?: number;
        perPage?: number;
        sort?: MaybeArray<Sort<ExpandedRecord>>;
        filter?: Filter<ExpandedRecord>;
    } & SendOptions): Promise<ResolveSelectWithExpand<Collection, TSelect>[]>;
    getList<TSelect extends SelectWithExpand<Collection> | {}>(page?: number, perPage?: number, options?: {
        select?: TSelect;
        sort?: MaybeArray<Sort<ExpandedRecord>>;
        filter?: Filter<ExpandedRecord>;
    } & SendOptions): Promise<ListResult<ResolveSelectWithExpand<Collection, TSelect>>>;
    getFirstListItem<TSelect extends SelectWithExpand<Collection> | {}>(filter: Filter<ExpandedRecord>, options?: {
        select?: TSelect;
        sort?: MaybeArray<Sort<ExpandedRecord>>;
    } & SendOptions): Promise<ResolveSelectWithExpand<Collection, TSelect>>;
    getOne<TSelect extends SelectWithExpand<Collection> | {}>(id: string, options?: {
        select?: TSelect;
    } & SendOptions): Promise<ResolveSelectWithExpand<Collection, TSelect>>;
    createFilter(filter: Filter<ExpandedRecord>): Filter<ExpandedRecord>;
    createSort(...sort: Sort<ExpandedRecord>[]): Sort<ExpandedRecord>;
    createSelect<T extends SelectWithExpand<Collection>>(select: T): T;
}
interface BaseCollectionService<Collection extends GenericCollection> extends ViewCollectionService<Collection> {
    create<TSelect extends SelectWithExpand<Collection> | {}>(bodyParams: Collection['create'], options?: {
        select?: TSelect;
    } & SendOptions): Promise<ResolveSelectWithExpand<Collection, TSelect>>;
    update<TSelect extends SelectWithExpand<Collection> | {}>(id: string, bodyParams: Collection['update'], options?: {
        select?: TSelect;
    } & SendOptions): Promise<ResolveSelectWithExpand<Collection, TSelect>>;
    delete(id: string): Promise<boolean>;
}
interface AuthCollectionService<Collection extends GenericCollection> extends BaseCollectionService<Collection>, Pick<RecordService, (typeof FORWARD_METHODS)[number]> {
    authWithPassword<TSelect extends SelectWithExpand<Collection> | {}>(usernameOrEmail: string, password: string, options?: {
        select?: TSelect;
    } & SendOptions): Promise<RecordAuthResponse<ResolveSelectWithExpand<Collection, TSelect>>>;
    authWithOAuth2Code<TSelect extends SelectWithExpand<Collection> | {}>(provider: string, code: string, codeVerifier: string, redirectUrl: string, createData?: {
        [key: string]: any;
    }, options?: {
        select?: TSelect;
    } & SendOptions): Promise<RecordAuthResponse<ResolveSelectWithExpand<Collection, TSelect>>>;
    authWithOAuth2(options: Omit<OAuth2AuthConfig, 'createData'> & {
        createData?: Collection['create'];
    } & SendOptions): Promise<RecordAuthResponse<Collection['response']>>;
    authRefresh<TSelect extends SelectWithExpand<Collection> | {}>(options?: {
        select?: TSelect;
    } & SendOptions): Promise<RecordAuthResponse<ResolveSelectWithExpand<Collection, TSelect>>>;
}
declare const FORWARD_METHODS: readonly ["unsubscribe", "listAuthMethods", "requestPasswordReset", "confirmPasswordReset", "requestVerification", "confirmVerification", "requestEmailChange", "confirmEmailChange", "listExternalAuths", "unlinkExternalAuth"];
declare class TypedRecordService implements BaseCollectionService<GenericCollection> {
    readonly service: RecordService<any>;
    constructor(service: RecordService<any>);
    get client(): PocketBase;
    get collectionName(): string;
    private prepareOptions;
    createFilter(filter: Filter<Record<string, any>>): string | null;
    createSort(...sorters: any[]): any;
    createSelect(select: any): any;
    subscribe(topic: string, callback: (data: RecordSubscription<any>) => void, options?: SendOptions): Promise<UnsubscribeFunc>;
    getFullList(options?: SendOptions): Promise<any[]>;
    getList(page?: number, perPage?: number, options?: SendOptions): Promise<ListResult<any>>;
    getFirstListItem(filter: string, options?: SendOptions): Promise<any>;
    getOne(id: string, options?: {
        select?: any;
    } & SendOptions): Promise<any>;
    create(bodyParams?: {
        [key: string]: any;
    } | FormData, options?: {
        select?: any;
    } & SendOptions): Promise<any>;
    update(id: string, bodyParams?: FormData | {
        [key: string]: any;
    }, options?: {
        select?: any;
    } & SendOptions): Promise<any>;
    delete(id: string, options?: SendOptions): Promise<boolean>;
    authWithPassword(usernameOrEmail: string, password: string, options?: RecordOptions | undefined): Promise<RecordAuthResponse<any>>;
    authWithOAuth2Code(provider: string, code: string, codeVerifier: string, redirectUrl: string, createData?: {
        [key: string]: any;
    } | undefined, options?: RecordOptions | undefined): Promise<RecordAuthResponse<any>>;
    authWithOAuth2(options: OAuth2AuthConfig): Promise<RecordAuthResponse>;
    authRefresh(options?: RecordOptions | undefined): Promise<RecordAuthResponse<any>>;
}
declare class TypedPocketBase<Schema extends GenericSchema> extends PocketBase {
    from<CollectionName extends keyof Schema, Collection extends GenericCollection = Schema[CollectionName]>(name: CollectionName): Collection['type'] extends 'view' ? ViewCollectionService<Collection> : Collection['type'] extends 'base' ? BaseCollectionService<Collection> : AuthCollectionService<Collection>;
}

export { type AuthCollectionService, type BaseCollectionService, type Filter, type GenericCollection, type GenericSchema, type ResolveSelect, type ResolveSelectWithExpand, type Select, type SelectWithExpand, type Sort, TypedPocketBase, type TypedRecord, TypedRecordService, type ViewCollectionService, and, eq, gt, gte, like, lt, lte, neq, nlike, or };
