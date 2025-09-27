// import type {NDKSessionStorageAdapter} from "@nostr-dev-kit/ndk-hooks";
// import {Dexie, type EntityTable} from 'dexie';
//
// interface NDKDexieOptions {
//     dbName: string
// }
//
// interface Data {
//     key: string
//     value: string
// }
//
// export class NDKDexieStorage implements NDKSessionStorageAdapter {
//     private dbInstance
//
//     constructor({dbName}: NDKDexieOptions) {
//         this.dbInstance = new Dexie(dbName) as Dexie & {
//             ndk: EntityTable<Data, 'key'>;
//         };
//         this.dbInstance.version(1).stores({
//             ndk: 'key, value',
//         });
//     }
//
//     deleteItem(key: string): void {
//          this.dbInstance.ndk.where("key", key).delete()
//     }
//
//     getItem(key: string): string | null {
//         return this.dbInstance.ndk.where("key", key).toArray()
//     }
//
//     setItem(key: string, value: string): void {
//         return this.dbInstance.ndk.add({key, value})
//     }
//
// }