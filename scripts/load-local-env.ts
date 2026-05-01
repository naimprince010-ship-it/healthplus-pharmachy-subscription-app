/** Import first in scripts that use Prisma: `import './load-local-env'`. ESM runs imports before other statements. */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })
