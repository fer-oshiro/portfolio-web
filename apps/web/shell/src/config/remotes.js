const REMOTE_ENTRY_FILE = 'remoteEntry.js'

const remoteDefinitions = {
  home: {
    productionBaseUrl: 'https://fer-oshiro.com/home',
    developmentPort: 3001,
  },
  blog: {
    productionBaseUrl: 'https://fer-oshiro.com/blog',
    developmentPort: 3003,
  },
  resume: {
    productionBaseUrl: 'https://fer-oshiro.com/resume',
    developmentPort: 3002,
  },
}

function createRemoteEntries({ isProduction, lanIp }) {
  return Object.fromEntries(
    Object.entries(remoteDefinitions).map(
      ([name, { productionBaseUrl, developmentPort }]) => {
        const baseUrl = isProduction
          ? productionBaseUrl
          : `http://${lanIp}:${developmentPort}`

        return [name, `${name}@${baseUrl}/${REMOTE_ENTRY_FILE}`]
      },
    ),
  )
}

module.exports = {
  createRemoteEntries,
}
