export interface ClientItem {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
  websiteUrl?: string;
  createdAt: number;
}

const CLIENTS_STORAGE_KEY = "praavi_clients_items";
const DEFAULT_LOGO = "/placeholder.svg";

const defaultClients: ClientItem[] = [
  { id: "client-1", name: "Kamou Solar", category: "Technology", logoUrl: DEFAULT_LOGO, websiteUrl: "", createdAt: 1739145600000 },
  { id: "client-2", name: "Vynk Parking", category: "Technology", logoUrl: DEFAULT_LOGO, websiteUrl: "", createdAt: 1739060000000 },
  { id: "client-3", name: "BanquetBee", category: "Hospitality", logoUrl: DEFAULT_LOGO, websiteUrl: "", createdAt: 1738970000000 },
  { id: "client-4", name: "FreshBites", category: "Food & Beverages", logoUrl: DEFAULT_LOGO, websiteUrl: "", createdAt: 1738880000000 },
];

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizeClient = (client: Partial<ClientItem>): ClientItem | null => {
  if (!client.id || !client.name || !client.category) return null;
  return {
    id: client.id,
    name: client.name.trim(),
    category: client.category.trim(),
    logoUrl: client.logoUrl?.trim() || DEFAULT_LOGO,
    websiteUrl: client.websiteUrl?.trim() || "",
    createdAt: typeof client.createdAt === "number" ? client.createdAt : Date.now(),
  };
};

const normalizeClients = (clients: Partial<ClientItem>[]) =>
  clients
    .map(normalizeClient)
    .filter((client): client is ClientItem => !!client)
    .sort((a, b) => b.createdAt - a.createdAt);

export const getClientsItems = (): ClientItem[] => {
  if (!canUseStorage()) return normalizeClients(defaultClients);
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) return normalizeClients(defaultClients);
    const parsed = JSON.parse(raw) as Partial<ClientItem>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return normalizeClients(defaultClients);
    const normalized = normalizeClients(parsed);
    return normalized.length ? normalized : normalizeClients(defaultClients);
  } catch {
    return normalizeClients(defaultClients);
  }
};

export const saveClientsItems = (clients: ClientItem[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(normalizeClients(clients)));
};
