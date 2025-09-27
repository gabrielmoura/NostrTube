import NDK__default, {imetaTagToTag, NDKTag} from '@nostr-dev-kit/ndk';
import {NDKBlossom} from '@nostr-dev-kit/ndk-blossom';

export class BlossomUpload {
    private blossom: NDKBlossom

    constructor(ndk: NDK__default) {
        this.blossom = new NDKBlossom(ndk);
    }

    public async upload(file: File): Promise<NDKTag> {
        this.blossom.onUploadFailed = (error) => console.error(error);
        this.blossom.onUploadProgress = (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload progress: ${percentage}%`);
            return 'continue';
        };
        const imeta = await this.blossom.upload(file);
        console.log('File uploaded:', imeta);
        return imetaTagToTag(imeta)
    }
}