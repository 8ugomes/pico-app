type MobileArena = {
  image?: string | null;
  directory?: ({ photos?: unknown[] } & Record<string, unknown>) | null;
} & Record<string, unknown>;

function sanitizeArena(arena: MobileArena): MobileArena {
  return {
    ...arena,
    image: typeof arena.image === 'string' && arena.image.startsWith('/images/arenas/') ? null : arena.image,
    directory: arena.directory ? { ...arena.directory, photos: [] } : arena.directory,
  };
}

/**
 * The public PWA catalog keeps its researched photo archive. The distributable
 * iOS client only receives owner-uploaded covers until Pico holds explicit
 * distribution rights for each imported catalog image.
 */
export function sanitizeMobileReadData<T>(data: T): T {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const record = data as Record<string, unknown>;
  if (record.kind === 'arenas' && Array.isArray(record.arenas)) {
    return { ...record, arenas: record.arenas.map((arena) => sanitizeArena(arena as MobileArena)) } as T;
  }
  if (record.kind === 'arena' && record.arena && typeof record.arena === 'object' && !Array.isArray(record.arena)) {
    return { ...record, arena: sanitizeArena(record.arena as MobileArena) } as T;
  }
  return data;
}
