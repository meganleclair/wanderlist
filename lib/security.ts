// Input validation and sanitization utilities

// Sanitize string input - removes potential XSS vectors
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, 500) // Limit length
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Validate city name - only allow alphanumeric, spaces, and common punctuation
export function isValidCityName(city: string): boolean {
  if (!city || typeof city !== 'string') return false
  if (city.length < 1 || city.length > 100) return false
  
  // Allow letters, spaces, hyphens, apostrophes, periods (for abbreviations)
  const validPattern = /^[\p{L}\p{M}\s\-'.]+$/u
  return validPattern.test(city)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email) && email.length <= 254
}

// Validate UUID format (for IDs)
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(id)
}

// Simple in-memory rate limiter for API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 30, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }
  
  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now }
}

// Get client IP from request headers
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

// Validate auth token format (basic check)
export function isValidAuthToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  // JWT format: xxx.xxx.xxx
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}
