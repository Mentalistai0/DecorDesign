import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envExamplePath = path.join(__dirname, '.env.example')
const envPath = path.join(__dirname, '.env')

// Check if .env exists
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    // Copy .env.example to .env
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Created .env file from .env.example')
    console.log('ℹ️  Please update the .env file with your API keys if needed')
  } else {
    console.error('❌ .env.example file not found')
    process.exit(1)
  }
} else {
  console.log('✅ .env file already exists')
}
