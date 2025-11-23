#!/usr/bin/env node

/**
 * CI Check: Verify Next.js 16 Promise-based params and searchParams
 * 
 * This script checks that all page components and route handlers use
 * Promise-based types for params and searchParams as required by Next.js 16.
 * 
 * Usage:
 *   node scripts/check-nextjs16-params.js
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Found incorrect param types
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function findFiles(dir, pattern) {
  try {
    const result = execSync(`find ${dir} -name "${pattern}" -type f`, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
    })
    return result.trim().split('\n').filter(Boolean)
  } catch (error) {
    return []
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const errors = []

  if (content.includes("'use client'") || content.includes('"use client"')) {
    return errors
  }

  const paramsPattern = /params:\s*\{\s*[^}]+\s*\}/g
  const paramsMatches = content.match(paramsPattern) || []
  
  for (const match of paramsMatches) {
    const index = content.indexOf(match)
    const before = content.substring(Math.max(0, index - 20), index)
    
    if (!before.includes('Promise<')) {
      errors.push({
        file: filePath,
        issue: 'Non-Promise params type',
        line: content.substring(0, index).split('\n').length,
        snippet: match,
        fix: 'Change to: params: Promise<{ ... }>',
      })
    }
  }

  const searchParamsPattern = /searchParams:\s*\{\s*[^}]+\s*\}/g
  const searchParamsMatches = content.match(searchParamsPattern) || []
  
  for (const match of searchParamsMatches) {
    const index = content.indexOf(match)
    const before = content.substring(Math.max(0, index - 20), index)
    
    if (!before.includes('Promise<')) {
      errors.push({
        file: filePath,
        issue: 'Non-Promise searchParams type',
        line: content.substring(0, index).split('\n').length,
        snippet: match,
        fix: 'Change to: searchParams: Promise<{ ... }>',
      })
    }
  }

  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (
      (line.includes('params.') || line.includes('searchParams.')) &&
      !line.includes('await') &&
      !line.includes('useParams') &&
      !line.includes('useSearchParams') &&
      !line.includes('//') // Skip comments
    ) {
      const prevLine = i > 0 ? lines[i - 1] : ''
      if (!prevLine.includes('await')) {
        errors.push({
          file: filePath,
          issue: 'Possible direct params/searchParams access without await',
          line: i + 1,
          snippet: line.trim(),
          fix: 'Ensure you await params/searchParams before accessing properties',
          warning: true,
        })
      }
    }
  }

  return errors
}

function main() {
  console.log(`${YELLOW}Checking Next.js 16 params and searchParams usage...${RESET}\n`)

  const pageFiles = findFiles('app', 'page.tsx')
  console.log(`Found ${pageFiles.length} page.tsx files`)

  const routeFiles = findFiles('app', 'route.ts')
  console.log(`Found ${routeFiles.length} route.ts files\n`)

  const allFiles = [...pageFiles, ...routeFiles]
  const allErrors = []
  const allWarnings = []

  for (const file of allFiles) {
    const errors = checkFile(file)
    for (const error of errors) {
      if (error.warning) {
        allWarnings.push(error)
      } else {
        allErrors.push(error)
      }
    }
  }

  if (allErrors.length > 0) {
    console.log(`${RED}❌ Found ${allErrors.length} error(s):${RESET}\n`)
    for (const error of allErrors) {
      console.log(`${RED}Error:${RESET} ${error.issue}`)
      console.log(`  File: ${error.file}:${error.line}`)
      console.log(`  Code: ${error.snippet}`)
      console.log(`  Fix:  ${error.fix}\n`)
    }
  }

  if (allWarnings.length > 0) {
    console.log(`${YELLOW}⚠️  Found ${allWarnings.length} warning(s):${RESET}\n`)
    for (const warning of allWarnings) {
      console.log(`${YELLOW}Warning:${RESET} ${warning.issue}`)
      console.log(`  File: ${warning.file}:${warning.line}`)
      console.log(`  Code: ${warning.snippet}`)
      console.log(`  Fix:  ${warning.fix}\n`)
    }
  }

  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(`${GREEN}✅ All checks passed! No issues found.${RESET}`)
    process.exit(0)
  } else if (allErrors.length === 0) {
    console.log(`${GREEN}✅ No errors found. Please review warnings above.${RESET}`)
    process.exit(0)
  } else {
    console.log(`${RED}❌ Found ${allErrors.length} error(s). Please fix them before committing.${RESET}`)
    console.log(`\n${YELLOW}Tip:${RESET} Use the shared types from types/page.ts:`)
    console.log(`  import { PageParams, PageSearchParams } from '@/types/page'`)
    console.log(`\nOr check the templates in templates/ directory for examples.`)
    process.exit(1)
  }
}

main()
