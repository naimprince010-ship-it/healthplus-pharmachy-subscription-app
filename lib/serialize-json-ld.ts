/**
 * Embed JSON-LD in `dangerouslySetInnerHTML` safely: raw `</script>` in any string
 * ends the HTML script tag early and can crash RSC / hydration.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
