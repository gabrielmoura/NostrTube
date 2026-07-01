export interface BlossomServer {
  url: string
  name: string
  region: string
}

// Mock Blossom servers data
export const MOCK_BLOSSOM_SERVERS: BlossomServer[] = [
  { url: "https://cdn.nostr.build", name: "Nostr.Build CDN", region: "Global" },
  { url: "https://media.libernet.app", name: "LiberMedia", region: "Global" },
  { url: "https://cdn.void.cat", name: "Void Cat", region: "Global" },
  { url: "https://internationalright-wing.org", name: "Organização da Direita Internacional", region: "BR" },
  { url: "https://cdn.satellite.earth", name: "Satellite CDN", region: "US" },
  { url: "https://media.nostr.band", name: "Nostr Band", region: "US" },
  { url: "https://blossom.primal.net", name: "Primal Storage", region: "EU" },
  { url: "https://files.nostr.ch", name: "Nostr CH", region: "EU" }
];