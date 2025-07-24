<?php
// Load cookies from file
$cookiesFile = 'cookies.txt';
$cookies = file_exists($cookiesFile) ? trim(file_get_contents($cookiesFile)) : '';

$targetBase = 'https://elements.envato.com/';
$path = $_SERVER['REQUEST_URI'];

// Handle both direct access (proxy.php/path) and .htaccess rewrites (/path)
if (strpos($path, '/proxy.php/') === 0) {
    // Direct access: proxy.php/graphics/photo-123
    $path = substr($path, 10); // Remove '/proxy.php'
} elseif (strpos($path, '/proxy.php') === 0) {
    // Handle proxy.php?path=something or just proxy.php
    if (isset($_GET['path'])) {
        $path = '/' . ltrim($_GET['path'], '/');
    } else {
        $path = '/';
    }
}

// Clean the path - remove query parameters for cleaner URL construction
$cleanPath = parse_url($path, PHP_URL_PATH);
$queryString = parse_url($path, PHP_URL_QUERY);

// Remove leading slash and construct target URL
$targetURL = $targetBase . ltrim($cleanPath, '/');
if ($queryString) {
    $targetURL .= '?' . $queryString;
}

// If path is empty or just '/', redirect to graphics page
if (empty($cleanPath) || $cleanPath === '/') {
    $targetURL = $targetBase . 'graphics';
}

// Initialize cURL with better options for downloads
$ch = curl_init($targetURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 minutes timeout for large downloads
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

// Forward original request headers
$headers = [];
if ($cookies) {
    $headers[] = "Cookie: $cookies";
}

// Forward important headers from the original request
$forwardHeaders = ['Accept', 'Accept-Language', 'Accept-Encoding', 'Referer', 'Authorization'];
foreach ($forwardHeaders as $headerName) {
    $headerKey = 'HTTP_' . strtoupper(str_replace('-', '_', $headerName));
    if (isset($_SERVER[$headerKey])) {
        $headers[] = "$headerName: " . $_SERVER[$headerKey];
    }
}

// Add essential headers for Envato Elements
$headers[] = "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8";
$headers[] = "Accept-Language: en-US,en;q=0.9";
$headers[] = "Cache-Control: no-cache";
$headers[] = "Pragma: no-cache";
$headers[] = "Upgrade-Insecure-Requests: 1";

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward POST data if present
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

if (curl_error($ch)) {
    http_response_code(502);
    echo "Proxy Error: " . curl_error($ch);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Parse response
$responseHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Set HTTP response code
http_response_code($httpCode);

// Process and forward response headers
$headerLines = explode("\r\n", $responseHeaders);
$contentTypeSet = false;
$isDownload = false;

foreach ($headerLines as $header) {
    $header = trim($header);
    if (empty($header) || strpos($header, 'HTTP/') === 0) {
        continue;
    }
    
    $headerLower = strtolower($header);
    
    if (stripos($header, 'Content-Type:') === 0) {
        header($header);
        $contentTypeSet = true;
        // Check if this is a download (not HTML)
        if (strpos($headerLower, 'application/') !== false || 
            strpos($headerLower, 'binary') !== false ||
            strpos($headerLower, 'octet-stream') !== false) {
            $isDownload = true;
        }
    } elseif (stripos($header, 'Content-Disposition:') === 0) {
        header($header);
        $isDownload = true;
    } elseif (stripos($header, 'Content-Length:') === 0) {
        header($header);
    } elseif (stripos($header, 'Content-Encoding:') === 0) {
        header($header);
    } elseif (stripos($header, 'Cache-Control:') === 0) {
        header($header);
    } elseif (stripos($header, 'Expires:') === 0) {
        header($header);
    } elseif (stripos($header, 'Last-Modified:') === 0) {
        header($header);
    } elseif (stripos($header, 'ETag:') === 0) {
        header($header);
    } elseif (stripos($header, 'Location:') === 0) {
        // Handle redirects
        $redirectUrl = trim(substr($header, 9));
        if (strpos($redirectUrl, $targetBase) === 0) {
            // Rewrite Envato URLs to go through proxy
            $redirectUrl = str_replace($targetBase, $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . '/', $redirectUrl);
        }
        header('Location: ' . $redirectUrl, true, $httpCode);
    }
}

// Fallback content type
if (!$contentTypeSet) {
    if ($isDownload) {
        header('Content-Type: application/octet-stream');
    } else {
        header('Content-Type: text/html; charset=utf-8');
    }
}

// CORS headers for browser requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, HEAD');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// For downloads, output directly without modification
if ($isDownload) {
    echo $body;
    exit;
}

// Only inject JavaScript for HTML content
if (strpos($contentType, 'text/html') !== false && !$isDownload) {
    $injectScript = <<<HTML
<script>
console.log("Envato Elements Proxy Active");
document.addEventListener('DOMContentLoaded', function () {
    // Rewrite Envato Elements links to go through proxy
    const currentOrigin = window.location.origin;
    const envatoBase = 'https://elements.envato.com/';
    
    // Rewrite all Envato links
    document.querySelectorAll('a[href*="elements.envato.com"]').forEach(el => {
        if (el.href.startsWith(envatoBase)) {
            el.href = currentOrigin + '/' + el.href.substring(envatoBase.length);
        }
    });
    
    // Rewrite form actions
    document.querySelectorAll('form[action*="elements.envato.com"]').forEach(form => {
        if (form.action.startsWith(envatoBase)) {
            form.action = currentOrigin + '/' + form.action.substring(envatoBase.length);
        }
    });
    
    // Handle dynamic content and AJAX requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && url.startsWith(envatoBase)) {
            url = currentOrigin + '/' + url.substring(envatoBase.length);
        }
        return originalFetch.call(this, url, options);
    };
});
</script>
HTML;

    // Inject script before closing body tag
    if (stripos($body, '</body>') !== false) {
        $body = preg_replace('/<\/body>/i', $injectScript . '</body>', $body, 1);
    } else {
        // If no body tag, append at the end
        $body .= $injectScript;
    }
}

// Output the final content
echo $body;
?>