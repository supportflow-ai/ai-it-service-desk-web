const dateTime: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
const dateOnly: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

/** An article timestamp in Vietnamese format; an unparsable value is shown as sent. */
export function formatArticleDate(iso: string, withTime = true) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', withTime ? dateTime : dateOnly);
}
