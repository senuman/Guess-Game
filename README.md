# Envato Elements Proxy

A PHP proxy script to access Envato Elements content through your own server.

## Files Overview

- `proxy.php` - Main proxy script with improved download handling
- `debug.php` - Debug script to test proxy functionality
- `cookies.txt` - File to store your Envato Elements session cookies
- `.htaccess` - Apache configuration for clean URLs and PHP settings

## Setup Instructions

### 1. Upload Files
Upload all files to your web server directory.

### 2. Get Your Cookies
1. Go to [Envato Elements](https://elements.envato.com) and log in
2. Open Developer Tools (F12)
3. Go to Application → Cookies → elements.envato.com
4. Copy all cookie values
5. Format them as: `name1=value1; name2=value2; name3=value3`
6. Paste into `cookies.txt` file

### 3. Test the Setup
Visit `your-domain.com/debug.php` to test your configuration.

## Usage

Once set up, you can access Envato Elements through your proxy:

- Browse: `your-domain.com/graphics`
- Download: `your-domain.com/download/item-id`
- Search: `your-domain.com/search?q=business`

## Key Improvements Made

### Download Issues Fixed:
1. **Better URL parsing** - Properly handles query parameters and paths
2. **Enhanced headers** - Forwards all necessary authentication and browser headers
3. **Download detection** - Properly identifies download responses vs HTML pages
4. **Binary safety** - Handles large file downloads without corruption
5. **Timeout handling** - Extended timeouts for large downloads (5 minutes)
6. **Error handling** - Better cURL error reporting

### Authentication Improvements:
1. **Cookie forwarding** - Properly forwards session cookies
2. **Header preservation** - Maintains authentication headers
3. **User agent** - Uses realistic browser user agent
4. **Referer handling** - Forwards referer headers when needed

### Performance Enhancements:
1. **Memory limits** - Increased PHP memory limits via .htaccess
2. **Execution time** - Extended script execution time for downloads
3. **Compression** - Enabled gzip compression for better performance
4. **Caching** - Added cache headers for static content

## Troubleshooting

### Problem: Downloads fail or timeout
**Solution:**
- Check `debug.php` for configuration issues
- Ensure cookies are valid and current
- Verify PHP memory and execution time limits
- Check server error logs

### Problem: Access denied or authentication errors
**Solution:**
- Update cookies in `cookies.txt` (they expire regularly)
- Ensure all cookie values are copied correctly
- Check that your Envato Elements subscription is active

### Problem: Files are corrupted
**Solution:**
- The new proxy handles binary files properly
- Check PHP settings for `max_execution_time` and `memory_limit`
- Ensure server has enough disk space

### Problem: Redirects not working
**Solution:**
- The proxy now properly handles Envato redirects
- Check `.htaccess` is working (RewriteEngine On)
- Verify clean URLs are functioning

## Security Notes

- The `cookies.txt` file is protected by `.htaccess`
- Never share your cookies or proxy URL publicly
- Regularly update your cookies for security
- Use this only for personal/authorized use

## Testing

1. Run `debug.php` to check configuration
2. Test with simple content first (images, graphics)
3. Try downloading small files before large ones
4. Monitor server error logs for issues

## Common Cookie Names for Envato Elements

Look for these cookies in your browser:
- `laravel_session`
- `XSRF-TOKEN`
- `remember_web_*`
- `_ga`, `_gid` (Google Analytics - optional)

Copy ALL cookies from elements.envato.com domain for best results.