# NostrTube

## Proxy Image

```bash
docker run -d -e="IMGPROXY_ALLOWED_SOURCES:*,https://*,https://*/*,s3://*" -e="IMGPROXY_ALLOW_LOOPBACK_SOURCE_ADDRESSES:true" -e"IMGPROXY_ALLOW_LINK_LOCAL_SOURCE_ADDRESSES:true" -e"IMGPROXY_IGNORE_SSL_VERIFICATION:true" --add-host=host.docker.internal:host-gateway -p=9095:8080 --name="imgproxy"  ghcr.io/imgproxy/imgproxy:latest
```

```env
VITE_APP_IMGPROXY=http://localhost:9095
```

https://github.com/nostr-protocol/nips/blob/master/89.md#client-tag

Uma lista de servidores Blossom podem ser encontrados aqui: https://blossomservers.com/