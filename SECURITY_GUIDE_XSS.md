# XSS Prevention Guide: Safe Usage of dangerouslySetInnerHTML

## Overview

This document outlines the security measures implemented in the TopSteel project to prevent XSS (Cross-Site Scripting) vulnerabilities when using React's `dangerouslySetInnerHTML` property.

## Security Measures Implemented

### 1. DOMPurify Integration

All `dangerouslySetInnerHTML` usages now utilize DOMPurify for HTML sanitization:

```typescript
import DOMPurify from 'isomorphic-dompurify'

// Before (UNSAFE)
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// After (SAFE)
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: ['class'],
    FORBID_SCRIPT: true
  }) 
}} />
```

### 2. Standardized Sanitization Utility

A centralized sanitization utility (`@erp/ui/lib/security/dom-sanitizer`) provides:

- `sanitizeRichText()` - For rich text editors and CMS content
- `sanitizeHighlight()` - For search highlights 
- `sanitizeBasic()` - For simple formatted text
- `validateHtmlSafety()` - For content validation

```typescript
import { DOMSanitizer } from '@erp/ui'

// Rich text content
const safeHtml = DOMSanitizer.richText(userContent)

// Search highlights
const safeHighlight = DOMSanitizer.highlight(searchResult)

// Basic formatting only
const safeBasic = DOMSanitizer.basic(simpleText)
```

### 3. Configuration Presets

Three security levels are available:

#### Basic Configuration
- Tags: `p`, `br`, `strong`, `b`, `em`, `i`, `u`, `span`
- Attributes: `class` only
- Use case: Simple text formatting

#### Highlight Configuration  
- Tags: `mark`, `strong`, `em`, `span`
- Attributes: `class` only
- Use case: Search result highlighting

#### Rich Text Configuration
- Tags: All formatting tags plus `a`, `img`, `blockquote`
- Attributes: `href`, `src`, `alt`, `title`, `target`, `rel`, `class`, `style`
- Use case: CMS content, product descriptions

### 4. Mandatory Security Comments

All `dangerouslySetInnerHTML` usage must include explanatory comments:

```typescript
// Using dangerouslySetInnerHTML is necessary to render rich text content
// Content is sanitized with DOMPurify to prevent XSS vulnerabilities
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

## Files Secured

### High Priority (Web Applications)
- ✅ `apps/web/src/components/search/command-palette.tsx` - Search highlights
- ✅ `apps/web/src/components/admin/TranslationCellComponents.tsx` - Already secured
- ✅ `apps/marketplace-storefront/src/components/product/product-detail.tsx` - Product descriptions
- ✅ `apps/marketplace-storefront/src/components/page-builder/sections/TextBlockSection.tsx` - CMS content

### UI Components (Medium Priority)
- ✅ `packages/ui/src/components/data-display/datatable/DataTable.tsx` - Rich text cells
- ✅ `packages/ui/src/components/data-display/datatable/RichTextEditor.tsx` - Editor content
- ✅ `packages/ui/src/components/data-display/datatable/render-utils.ts` - Cell rendering
- ✅ `packages/ui/src/components/data-display/datatable/InlineEditor.tsx` - Inline editing

## Dependencies Added

### Marketplace Storefront
```json
{
  "dompurify": "^3.2.6",
  "isomorphic-dompurify": "^2.26.0"
}
```

### UI Package
```json
{
  "dompurify": "^3.2.6", 
  "isomorphic-dompurify": "^2.26.0"
}
```

### Web App (Already had)
- `dompurify`: ^3.2.6
- `isomorphic-dompurify`: ^2.26.0
- Custom security utilities in `src/lib/security/`

## Best Practices

### 1. Always Sanitize
Never use `dangerouslySetInnerHTML` without sanitization:

```typescript
// ❌ NEVER do this
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Always sanitize first  
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 2. Use Strict Configuration
Configure DOMPurify to allow only necessary tags and attributes:

```typescript
const config = {
  ALLOWED_TAGS: ['p', 'br', 'strong'], // Minimal set needed
  ALLOWED_ATTR: ['class'],            // No href, onclick, etc.
  FORBID_SCRIPT: true,                // Block all scripts
  FORBID_ATTR: ['onerror', 'onload']  // Block event handlers
}
```

### 3. Validate Input Sources
Be extra cautious with content from:
- User input (comments, descriptions)
- External APIs
- Database content that users can modify
- URL parameters
- Search results

### 4. Consider Alternatives
Before using `dangerouslySetInnerHTML`, consider:

```typescript
// Simple text - use regular JSX
<p>{text}</p>

// Markdown - use a markdown renderer
import ReactMarkdown from 'react-markdown'
<ReactMarkdown>{markdown}</ReactMarkdown>

// Rich text - use a safe rich text component
import { RichText } from '@erp/ui'
<RichText content={content} />
```

### 5. Regular Security Audits
- Review all `dangerouslySetInnerHTML` usage monthly
- Update DOMPurify regularly
- Test sanitization with malicious payloads
- Monitor for new XSS attack vectors

## Testing XSS Prevention

Test your sanitization with these payloads:

```javascript
// Script injection
"<script>alert('XSS')</script>"

// Event handlers
"<img src=x onerror='alert(\"XSS\")'>"

// JavaScript URLs  
"<a href='javascript:alert(\"XSS\")'>Click me</a>"

// Data URLs
"<iframe src='data:text/html,<script>alert(\"XSS\")</script>'></iframe>"

// CSS injection
"<style>body{background:url('javascript:alert(\"XSS\")')}</style>"
```

All of these should be safely neutralized by the sanitization.

## Monitoring and Maintenance

1. **Dependency Updates**: Keep DOMPurify updated to latest version
2. **Configuration Review**: Regularly review sanitization configs
3. **Code Scanning**: Use tools like CodeQL to detect unsafe usage
4. **Security Testing**: Include XSS tests in your test suite

## Emergency Response

If XSS vulnerability is discovered:

1. **Immediate**: Add strict sanitization to affected code
2. **Short-term**: Review all similar code patterns  
3. **Long-term**: Implement automated security scanning
4. **Communication**: Notify security team and stakeholders

## Resources

- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention Cheat Sheet](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)