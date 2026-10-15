/** A safe, readable file name from a project name: "Living room #2" -> "living-room-2.png". */
export function fileNameFor(name: string, extension: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop accents: "Čajna kuhinja" -> "cajna kuhinja"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'design'}.${extension}`;
}

/** Save a data URL (e.g. a canvas capture) as a file. */
export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
