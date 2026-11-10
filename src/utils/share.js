export const getCatalogUrl = (id) => {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('catalog', id)
  return url.toString()
}

export const shareCatalog = async (gun) => {
  const url = getCatalogUrl(gun.id)
  const title = `Catalog: ${gun.name}`

  if (navigator.share) {
    await navigator.share({ title, text: gun.name, url })
    return 'shared'
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
