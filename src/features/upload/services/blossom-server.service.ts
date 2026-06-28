import NDK, { NDKEvent } from "@nostr-dev-kit/ndk";
import { NDKBlossom } from "@nostr-dev-kit/ndk-blossom";
import { MOCK_BLOSSOM_SERVERS } from "@/default";
import useUserStore from "@/store/useUserStore";
import { LoggerAgent } from "@/lib/debug";

const logger = LoggerAgent.create("BlossomServers");

type UploadProgress = {
  loaded: number;
  total: number;
};

export interface BlossomMediaUploadResult {
  url: string;
  sha256?: string;
  x?: string;
  size?: string;
  m?: string;
  fallback?: string[];
  blurhash?: string;
  dim?: string;
  duration?: string;
}

export interface ConfiguredBlossomServers {
  primary: string;
  mirrors: string[];
  available: string[];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function normalizeBlossomServerUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function getDefaultPrimary() {
  return normalizeBlossomServerUrl(
    import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || MOCK_BLOSSOM_SERVERS[0]?.url || ""
  );
}

export function getConfiguredBlossomServers(): ConfiguredBlossomServers {
  const blossom = useUserStore.getState().blossom;
  const primary = normalizeBlossomServerUrl(blossom.default || getDefaultPrimary());
  const mirrors = uniqueStrings(blossom.mirrors.map(normalizeBlossomServerUrl)).filter((url) => url !== primary);
  const available = uniqueStrings([
    ...MOCK_BLOSSOM_SERVERS.map((server) => normalizeBlossomServerUrl(server.url)),
    ...blossom.custom.map(normalizeBlossomServerUrl),
    primary,
    ...mirrors
  ]);

  return { primary, mirrors, available };
}

export async function testBlossomServer(url: string): Promise<{ ok: boolean; message?: string }> {
  const normalized = normalizeBlossomServerUrl(url);

  try {
    const response = await fetch(`${normalized}/upload`, {
      method: "HEAD"
    });

    if (response.ok || response.status === 400 || response.status === 401 || response.status === 405) {
      return { ok: true };
    }

    return { ok: false, message: `Server responded with status ${response.status}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to reach server" };
  }
}

async function createBlossomAuthHeader(ndk: NDK, sha256: string, content: string) {
  const authEvent = new NDKEvent(ndk);
  authEvent.kind = 24242;
  authEvent.created_at = Math.floor(Date.now() / 1000);
  authEvent.content = content;
  authEvent.tags = [
    ["t", "upload"],
    ["x", sha256],
    ["expiration", String(Math.floor(Date.now() / 1000) + 3600)]
  ];
  await authEvent.sign();
  return `Nostr ${btoa(JSON.stringify(authEvent.rawEvent()))}`;
}

async function uploadToSpecificServer(
  ndk: NDK,
  file: File,
  server: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<BlossomMediaUploadResult> {
  const blossom = new NDKBlossom(ndk);
  blossom.debug = import.meta.env.DEV;

  if (onProgress) {
    blossom.onUploadProgress = (progress) => {
      onProgress(progress);
      return "continue";
    };
  }

  return blossom.upload(file, { server }) as Promise<BlossomMediaUploadResult>;
}

async function mirrorToServer(
  ndk: NDK,
  server: string,
  sourceUrl: string,
  sha256: string,
  fileName: string
): Promise<BlossomMediaUploadResult> {
  const authorization = await createBlossomAuthHeader(ndk, sha256, `Mirror ${fileName}`);
  const response = await fetch(`${server}/mirror`, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: sourceUrl })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Mirror request failed with status ${response.status}`);
  }

  return response.json() as Promise<BlossomMediaUploadResult>;
}

export async function uploadToConfiguredBlossomServers({
  ndk,
  file,
  onProgress,
  onMirroringStart,
  label
}: {
  ndk: NDK;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  onMirroringStart?: () => void;
  label?: string;
}) {
  const { primary, mirrors, available } = getConfiguredBlossomServers();
  const uploadCandidates = uniqueStrings([primary, ...available]);
  if (uploadCandidates.length === 0) {
    throw new Error("No Blossom server configured");
  }

  let primaryUpload: BlossomMediaUploadResult | undefined;
  let selectedServer: string | undefined;
  const uploadErrors: string[] = [];

  for (const server of uploadCandidates) {
    try {
      logger.debug("Uploading to Blossom server", { server, label, fileName: file.name, mirrors });
      primaryUpload = await uploadToSpecificServer(ndk, file, server, onProgress);
      selectedServer = server;
      break;
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : String(uploadError);
      uploadErrors.push(`${server}: ${message}`);
      logger.debug("Blossom upload failed, trying next server", {
        server,
        label,
        error: message
      });
    }
  }

  if (!primaryUpload || !selectedServer) {
    throw new Error(`Upload failed on all configured Blossom servers: ${uploadErrors.join("; ")}`);
  }

  const sha256 = primaryUpload.x || primaryUpload.sha256;

  const fallbackUrls: string[] = [];
  const mirrorCandidates = mirrors.filter((server) => server !== selectedServer);

  if (mirrorCandidates.length > 0 && sha256) {
    onMirroringStart?.();
  }

  for (const mirrorServer of mirrorCandidates) {
    if (!sha256) {
      logger.debug("Skipping mirror because sha256 is missing", { mirrorServer, label });
      continue;
    }

    try {
      const mirrored = await mirrorToServer(ndk, mirrorServer, primaryUpload.url, sha256, file.name);
      if (mirrored.url && mirrored.url !== primaryUpload.url) {
        fallbackUrls.push(mirrored.url);
      }
      logger.debug("BUD-04 mirror success", { mirrorServer, label, url: mirrored.url });
      continue;
    } catch (mirrorError) {
      logger.debug("BUD-04 mirror failed, falling back to direct upload", {
        mirrorServer,
        label,
        error: mirrorError instanceof Error ? mirrorError.message : String(mirrorError)
      });
    }

    try {
      const mirrored = await uploadToSpecificServer(ndk, file, mirrorServer);
      if (mirrored.url && mirrored.url !== primaryUpload.url) {
        fallbackUrls.push(mirrored.url);
      }
      logger.debug("Direct mirror upload success", { mirrorServer, label, url: mirrored.url });
    } catch (uploadError) {
      logger.debug("Direct mirror upload failed", {
        mirrorServer,
        label,
        error: uploadError instanceof Error ? uploadError.message : String(uploadError)
      });
    }
  }

  return {
    ...primaryUpload,
    fallback: uniqueStrings([...(primaryUpload.fallback ?? []), ...fallbackUrls])
  };
}
