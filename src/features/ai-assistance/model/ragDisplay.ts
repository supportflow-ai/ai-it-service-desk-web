/** When the suggestion was made, as the agent reads it; the raw text if it is not a date. */
export function formatGeneratedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
