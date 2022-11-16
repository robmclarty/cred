const DEFAULT_ALGORITHM = 'HS384'

const SUPPORTED_PUBLIC_KEY_ALGORITHMS = [
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512'
]

const init = (options = {}) => (req, res, next) => {
  const {
    key = 'cred',
    issuer = 'cred-issuer',
    store = 'memory',
    access = {
      secret: 'access-secret',
      privateKey: '',
      publicKey: '',
      expiresIn: '24 hours',
      algorithm: DEFAULT_ALGORITHM
    },
    refresh = {
      secret: 'refresh-secret',
      privateKey: '',
      publicKey: '',
      expiresIn: '7 days',
      algorithm: DEFAULT_ALGORITHM
    }
  } = options
}
