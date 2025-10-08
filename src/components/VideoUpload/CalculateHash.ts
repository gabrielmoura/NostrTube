import type {SHA256Calculator} from "@nostr-dev-kit/ndk-blossom/dist/types";
import {sha256} from "hash-wasm";

export class CalculateHash implements SHA256Calculator {
    async calculateSha256(file: File): Promise<string> {
        return await sha256(await file.text());
    }
}