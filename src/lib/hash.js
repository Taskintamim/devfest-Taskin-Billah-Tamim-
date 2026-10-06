export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function duplicateMap(files) {
  const byHash = new Map();
  for (const file of files) {
    if (!file.hash || file.status === "processing") continue;
    const list = byHash.get(file.hash) || [];
    list.push(file);
    byHash.set(file.hash, list);
  }

  const info = {};
  for (const group of byHash.values()) {
    if (group.length < 2) continue;
    for (const file of group) {
      const siblings = group.filter((item) => item.id !== file.id);
      const otherName = siblings.find((item) => item.name !== file.name)?.name || siblings[0]?.name || file.name;
      info[file.id] = {
        hash: file.hash,
        count: group.length,
        otherName,
        nameDiffers: otherName !== file.name,
      };
    }
  }
  return info;
}
