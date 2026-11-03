function devLinkPayload(link) {
  return process.env.NODE_ENV !== 'production' ? { dev_link: link } : {};
}

module.exports = { devLinkPayload };
