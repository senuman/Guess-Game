# Semrush Proxy with Site Audit Support

This PHP proxy allows you to access Semrush through your own domain with full Site Audit functionality.

## Setup Instructions

1. **Configure API Key**
   - Edit `api_config.php`
   - Replace `'your_secure_api_key_here_change_this'` with a strong, unique API key
   - Keep this key secret and secure

2. **File Permissions**
   ```bash
   chmod 644 index.php
   chmod 644 .htaccess
   chmod 600 api_config.php
   chmod 666 semrush_cookies.txt  # Will be created automatically
   chmod 666 error.log            # Will be created automatically
   ```

3. **Web Server Requirements**
   - PHP 7.4 or higher
   - cURL extension enabled
   - mod_rewrite enabled (Apache)
   - Session support enabled

## Site Audit Feature Fixes

The updated code includes several fixes specifically for the Site Audit feature:

### 1. Enhanced API Request Detection
- Better detection of Site Audit API calls (`/audit/`, `/api/`, `/projects/`)
- Proper content-type handling for JSON responses
- Enhanced CORS support for AJAX requests

### 2. Improved Header Handling
- Added required headers for Site Audit API calls:
  - `Accept: application/json, text/plain, */*`
  - `X-Requested-With: XMLHttpRequest`
  - `Referer: https://www.semrush.com/`
- Better cookie management with automatic saving/loading

### 3. JavaScript Enhancements
- XMLHttpRequest override to ensure proper URL rewriting
- Fetch API override for modern AJAX requests
- Automatic header injection for API calls

### 4. Timeout and Connection Improvements
- Increased timeout from 30 to 60 seconds for Site Audit operations
- Added connection timeout settings
- Better error reporting with detailed cURL errors

### 5. URL Rewriting Fixes
- Fixed relative URL handling that was breaking Site Audit assets
- Proper domain replacement in all contexts
- Enhanced redirect handling

## Usage

1. **Authentication**
   - Access your site with: `https://yourdomain.com/?apikey=YOUR_API_KEY`
   - Valid authentication will redirect to a clean URL and store session
   - Session lasts for 25 minutes with automatic redirect

2. **Site Audit Access**
   - Navigate to Projects > Site Audit
   - All API calls will be properly proxied
   - Full functionality should work including:
     - Creating new audits
     - Viewing audit results
     - Downloading reports
     - Real-time updates

## Troubleshooting

### Site Audit Not Loading
1. Check `error.log` for cURL errors
2. Verify PHP cURL extension is installed:
   ```bash
   php -m | grep curl
   ```
3. Check file permissions on cookie file
4. Ensure mod_rewrite is enabled

### API Calls Failing
1. Check browser network tab for failed requests
2. Look for CORS errors in browser console
3. Verify proper URL rewriting in network requests
4. Check if requests are hitting the proxy correctly

### Common Issues

**Issue: "Bad Request" error or blank page**
- **Solution**: This is now handled automatically by showing a loading page
- The system filters problematic headers that cause 400 errors
- Automatic retry mechanism will attempt to reload the page
- If persistent, check error.log for specific cURL errors

**Issue: Site Audit shows "Loading..." indefinitely**
- **Solution**: Check that JavaScript overrides are working
- Verify browser console for JavaScript errors
- Ensure CORS headers are being set correctly

**Issue: 404 errors on Site Audit API calls**
- **Solution**: Check `.htaccess` rewrite rules
- Verify mod_rewrite is enabled
- Check that all requests are being routed to `index.php`

**Issue: Authentication failing**
- **Solution**: Verify API key in `api_config.php`
- Check file permissions on config file
- Ensure session support is enabled in PHP

### Debug Mode

To enable debug logging, edit `api_config.php`:
```php
define('DEBUG_MODE', true);
```

This will log additional information to `error.log`.

## Security Notes

- Keep `api_config.php` secure and never expose your API key
- The `.htaccess` file prevents direct access to sensitive files
- Session timeout is set to 25 minutes for security
- Cookie file is protected from direct access

## File Structure

```
├── index.php              # Main proxy script
├── api_config.php          # API configuration (keep secure)
├── .htaccess              # URL rewriting and security
├── README.md              # This file
├── semrush_cookies.txt    # Cookie storage (auto-created)
└── error.log              # Error logging (auto-created)
```

## Support

If Site Audit is still not working after following these instructions:

1. Check the error log for specific error messages
2. Verify all prerequisites are met
3. Test with a simple Semrush page first before trying Site Audit
4. Contact your hosting provider to ensure cURL and mod_rewrite are properly configured