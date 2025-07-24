<?php
// Enable error reporting for debugging
ini_set('display_errors', 0); // Disable display for production
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Start session to track API key validation
session_start();

// Check for api_config.php existence
if (!file_exists(__DIR__ . '/api_config.php')) {
    error_log('api_config.php not found');
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error: Missing api_config.php']);
    exit;
}

// Load API key configuration
require_once __DIR__ . '/api_config.php';

// Verify API_KEY is defined
if (!defined('API_KEY')) {
    error_log('API_KEY not defined in api_config.php');
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error: API_KEY not defined']);
    exit;
}

// Check if API key is provided in URL
if (isset($_GET['apikey'])) {
    if ($_GET['apikey'] === API_KEY) {
        // Valid API key, store in session and redirect to clean URL
        $_SESSION['api_authenticated'] = true;
        $clean_url = preg_replace('/[?&]apikey=[^&]*/', '', $_SERVER['REQUEST_URI']);
        header("Location: https://semrush2.oneclickprovider.site" . $clean_url);
        exit;
    } else {
        // Invalid API key, redirect to app.ghostseotools.site
        header("Location: https://app.ghostseotools.site");
        echo "<script>window.location.href='https://app.ghostseotools.site';</script>";
        exit;
    }
}

// Check if user is authenticated via session
if (!isset($_SESSION['api_authenticated']) || $_SESSION['api_authenticated'] !== true) {
    // Redirect to app.ghostseotools.site for unauthenticated access
    header("Location: https://app.ghostseotools.site");
    echo "<script>window.location.href='https://app.ghostseotools.site';</script>";
    exit;
}

// Proxy setup
$cookie_file = __DIR__ . '/semrush_cookies.txt';
$target_host = 'https://www.semrush.com';
$proxy_host = 'https://semrush2.oneclickprovider.site';
$target_url = $target_host . $_SERVER['REQUEST_URI'];

// Remove apikey from target URL
$target_url = preg_replace('/[?&]apikey=[^&]*/', '', $target_url);

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

// Capture and forward headers
$headers = getallheaders();
$forward_headers = [];
foreach ($headers as $key => $value) {
    // Skip problematic headers but keep important ones for site audit
    $lower_key = strtolower($key);
    if (in_array($lower_key, ['host', 'connection', 'content-length'])) continue;
    
    // Preserve critical headers for site audit API calls
    if (in_array($lower_key, ['x-requested-with', 'accept', 'accept-language', 'accept-encoding', 'referer', 'x-csrf-token', 'authorization'])) {
        $forward_headers[] = "$key: $value";
    } elseif (!in_array($lower_key, ['host', 'connection', 'content-length', 'transfer-encoding'])) {
        $forward_headers[] = "$key: $value";
    }
}

// Add cookies from saved session
if (file_exists($cookie_file)) {
    $cookies = file_get_contents($cookie_file);
    if ($cookies !== false && !empty(trim($cookies))) {
        // Clean up cookies format
        $cookies = trim($cookies);
        $forward_headers[] = "Cookie: $cookies";
    } else {
        error_log('Cookie file is empty or unreadable: ' . $cookie_file);
    }
} else {
    error_log('Cookie file does not exist: ' . $cookie_file);
}

// Set User Agent - use a more recent one
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
$forward_headers[] = "User-Agent: $user_agent";

// Add essential headers for site audit functionality
$forward_headers[] = "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7";
$forward_headers[] = "Accept-Language: en-US,en;q=0.9";
$forward_headers[] = "Accept-Encoding: gzip, deflate, br";
$forward_headers[] = "Sec-Fetch-Dest: document";
$forward_headers[] = "Sec-Fetch-Mode: navigate";
$forward_headers[] = "Sec-Fetch-Site: same-origin";
$forward_headers[] = "Upgrade-Insecure-Requests: 1";

$method = $_SERVER['REQUEST_METHOD'];
$request_body = file_get_contents('php://input');

// Initialize cURL for proxying
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $target_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_HEADER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $forward_headers,
    CURLOPT_USERAGENT => $user_agent,
    CURLOPT_ENCODING => '', // Support gzip, br, deflate
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_TIMEOUT => 60, // Increased timeout for site audit operations
    CURLOPT_CONNECTTIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0, // Use HTTP/2 for better performance
    CURLOPT_COOKIEJAR => $cookie_file, // Save cookies
    CURLOPT_COOKIEFILE => $cookie_file, // Load cookies
]);

if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $request_body);
    if (!empty($request_body)) {
        // Set content length for POST requests
        $forward_headers[] = "Content-Length: " . strlen($request_body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $forward_headers);
    }
}

$response = curl_exec($ch);
if ($response === false) {
    $curl_error = curl_error($ch);
    $curl_errno = curl_errno($ch);
    error_log("cURL error #{$curl_errno}: {$curl_error} for URL: {$target_url}");
    http_response_code(500);
    echo json_encode(['error' => 'Proxy request failed', 'details' => $curl_error, 'errno' => $curl_errno]);
    curl_close($ch);
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$effective_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
curl_close($ch);

// Log for debugging site audit issues
if (strpos($_SERVER['REQUEST_URI'], 'audit') !== false) {
    error_log("Site Audit Request - URL: {$target_url}, HTTP Code: {$http_code}, Content-Type: {$contentType}");
}

// Set HTTP response code
http_response_code($http_code);

// Forward response headers more carefully
$headers_arr = explode("\r\n", $response_headers);
foreach ($headers_arr as $header) {
    $header = trim($header);
    if (empty($header)) continue;
    
    // Forward important headers
    if (stripos($header, 'Content-Type:') === 0) {
        header($header);
    } elseif (stripos($header, 'Content-Encoding:') === 0) {
        header($header);
    } elseif (stripos($header, 'Set-Cookie:') === 0) {
        header($header, false);
        // Also save cookies to file for persistence
        $cookie_value = trim(substr($header, 11)); // Remove "Set-Cookie: "
        file_put_contents($cookie_file, $cookie_value . "\n", FILE_APPEND | LOCK_EX);
    } elseif (stripos($header, 'Cache-Control:') === 0) {
        header($header);
    } elseif (stripos($header, 'Expires:') === 0) {
        header($header);
    } elseif (stripos($header, 'Last-Modified:') === 0) {
        header($header);
    } elseif (stripos($header, 'ETag:') === 0) {
        header($header);
    }
}

// Always allow CORS for fetch/XHR requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');

// Enhanced detection for Site Audit API/XHR calls
$is_api_call = (
    stripos($contentType, 'application/json') !== false ||
    stripos($contentType, 'application/javascript') !== false ||
    stripos($contentType, 'application/octet-stream') !== false ||
    stripos($contentType, 'text/plain') !== false ||
    stripos($_SERVER['REQUEST_URI'], '/audit/') !== false ||
    stripos($_SERVER['REQUEST_URI'], '/api/') !== false ||
    stripos($_SERVER['REQUEST_URI'], '/ajax/') !== false ||
    stripos($_SERVER['REQUEST_URI'], '.json') !== false ||
    isset($_SERVER['HTTP_X_REQUESTED_WITH']) ||
    (isset($_SERVER['HTTP_SEC_FETCH_MODE']) && $_SERVER['HTTP_SEC_FETCH_MODE'] === 'cors') ||
    (isset($_SERVER['HTTP_ACCEPT']) && stripos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
);

// If it's an API call or site audit related, return response directly
if ($is_api_call) {
    // Don't modify API responses
    echo $response_body;
    exit;
}

// Only process HTML responses for domain rewriting
if (stripos($contentType, 'text/html') !== false) {
    // Rewrite domains in HTML content
    $response_body = str_replace($target_host, $proxy_host, $response_body);
    $response_body = str_replace('www.semrush.com', 'semrush2.oneclickprovider.site', $response_body);
    
    // Fix relative URLs that might break site audit
    $response_body = preg_replace('/href=(["\'])\/([^"\']+)\1/', 'href=$1' . $proxy_host . '/$2$1', $response_body);
    $response_body = preg_replace('/src=(["\'])\/([^"\']+)\1/', 'src=$1' . $proxy_host . '/$2$1', $response_body);
    
    // Add branding watermark and extension detection
    $watermark = <<<HTML
<style>
.watermark-1 {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 9999;
    opacity: 0.92;
    font-family: 'Inter', sans-serif;
    background: rgba(255, 255, 255, 0.95);
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    color: #1a1a1a;
    font-size: 13px;
    max-width: 200px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.watermark-1:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}
.watermark-1 h4 {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    color: #1a1a1a;
}
.watermark-1 p {
    margin: 0;
    font-size: 12px;
    text-align: center;
    color: #4a4a4a;
}
.watermark-1 a {
    display: block;
    margin-top: 10px;
    text-align: center;
    padding: 8px;
    background: #1a1a1a;
    color: #fff;
    border-radius: 6px;
    text-decoration: none;
    font-size: 12px;
    font-weight: 500;
}
.watermark-1 a:hover {
    background: #333;
}
button.srf-dropdown-label.srf-nav-link[aria-label="My profile"][data-test="header-menu__user"],
nav.srf-navbar__primary,
button[data-test="header-menu__user"] {
    display: none !important;
}
.srf-header__logo::after {
    content: " by Ghost Seo Tools";
    font-size: 14px;
    vertical-align: middle;
    margin-left: 8px;
    animation: colorChange 15s infinite;
}
.extension-warning {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    justify-content: center;
    align-items: center;
}
.extension-warning-content {
    background: #fff;
    padding: 30px;
    border-radius: 12px;
    max-width: 450px;
    text-align: center;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}
.extension-warning-content h3 {
    margin: 0 0 15px;
    font-size: 20px;
    color: #d32f2f;
    font-weight: 600;
}
.extension-warning-content p {
    margin: 0 0 20px;
    font-size: 15px;
    color: #333;
    line-height: 1.5;
}
.extension-warning-content button {
    padding: 12px 24px;
    background: #d32f2f;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
}
.extension-warning-content button:hover {
    background: #b71c1c;
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function() {
    // Redirect to https://app.ghostseotools.site after 25 minutes
    setTimeout(function() {
        window.location.href = "https://app.ghostseotools.site";
    }, 25 * 60 * 1000);

    const buttons = document.querySelectorAll('button.srf-header__menu-link--user[data-test="header-menu__user"]');
    buttons.forEach(button => {
        button.style.pointerEvents = "none";
        button.style.opacity = "0.5";
        button.setAttribute("disabled", "true");
        button.addEventListener("click", (e) => e.preventDefault());
    });

    // Cookie-sharing extension detection
    function detectCookieExtension() {
        let suspicionScore = 0;
        const suspicionThreshold = 2;

        // Heuristic 1: Monitor cookie changes
        let initialCookies = document.cookie;
        setTimeout(() => {
            if (document.cookie !== initialCookies) {
                const cookieDiff = document.cookie.length - initialCookies.length;
                if (Math.abs(cookieDiff) > 50) {
                    suspicionScore++;
                    console.log("Suspicious cookie change detected");
                }
            }
        }, 3000);

        // Heuristic 2: Check for specific extension identifiers
        const suspiciousExtensions = [
            'edit-this-cookie',
            'cookie-editor',
            'cookie-manager'
        ];
        suspiciousExtensions.forEach(ext => {
            if (navigator.userAgent.toLowerCase().includes(ext) || 
                document.cookie.toLowerCase().includes(ext)) {
                suspicionScore++;
                console.log(`Suspicious extension identifier found: ${ext}`);
            }
        });

        // Heuristic 3: Detect suspicious network requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            if (typeof url === 'string' && 
                (url.includes('cookie') || url.includes('share') || url.includes('export')) &&
                !url.includes('semrush')) {
                suspicionScore++;
                console.log(`Suspicious fetch request to: ${url}`);
            }
            return originalFetch.apply(this, arguments);
        };

        // Check suspicion score
        setTimeout(() => {
            if (suspicionScore >= suspicionThreshold) {
                console.log(`Extension warning triggered with suspicion score: ${suspicionScore}`);
                showExtensionWarning();
            } else {
                console.log(`No extension detected, suspicion score: ${suspicionScore}`);
            }
        }, 4000);
    }

    // Show warning modal
    function showExtensionWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'extension-warning';
        warningDiv.innerHTML = `
            <div class="extension-warning-content">
                <h3>Cookie-Sharing Extension Detected</h3>
                <p>A cookie-sharing or cookie-management extension has been detected. Please disable it to continue using this service. After disabling, click the button below to proceed.</p>
                <button onclick="window.location.reload()">I Have Disabled the Extension</button>
            </div>
        `;
        document.body.appendChild(warningDiv);
        warningDiv.style.display = 'flex';
    }

    // Run detection
    detectCookieExtension();
});
</script>

<div class="watermark-1">
    <h4>Semrush</h4>
    <p>Powered by Ghost Seo Tools If You are using from anyother site</p>
    <a href="https://wa.me/+1234567890" target="_blank">Contact Admin</a>
</div>
HTML;

    // Inject watermark and styles into HTML
    if (stripos($response_body, '</body>') !== false) {
        $response_body = str_ireplace('</body>', $watermark . '</body>', $response_body);
    } else {
        $response_body .= $watermark;
    }
}

echo $response_body;
?>