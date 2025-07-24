<?php
// Debug script to test proxy functionality
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Envato Elements Proxy Debug</h2>";

// Test 1: Check cookies file
echo "<h3>1. Cookies Check</h3>";
$cookiesFile = 'cookies.txt';
if (file_exists($cookiesFile)) {
    $cookies = trim(file_get_contents($cookiesFile));
    if (empty($cookies) || strpos($cookies, '#') === 0) {
        echo "<p style='color: red;'>❌ No valid cookies found. You need to add your Envato Elements session cookies to cookies.txt</p>";
    } else {
        echo "<p style='color: green;'>✅ Cookies file exists and contains data</p>";
        echo "<p>Cookie length: " . strlen($cookies) . " characters</p>";
    }
} else {
    echo "<p style='color: red;'>❌ cookies.txt file not found</p>";
}

// Test 2: Check cURL functionality
echo "<h3>2. cURL Test</h3>";
if (function_exists('curl_init')) {
    echo "<p style='color: green;'>✅ cURL is available</p>";
    
    // Test basic connection to Envato Elements
    $ch = curl_init('https://elements.envato.com/');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request only
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "<p style='color: red;'>❌ cURL Error: $error</p>";
    } else {
        echo "<p style='color: green;'>✅ Successfully connected to Envato Elements (HTTP $httpCode)</p>";
    }
} else {
    echo "<p style='color: red;'>❌ cURL is not available</p>";
}

// Test 3: PHP Configuration
echo "<h3>3. PHP Configuration</h3>";
$importantSettings = [
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'allow_url_fopen' => ini_get('allow_url_fopen') ? 'Yes' : 'No'
];

foreach ($importantSettings as $setting => $value) {
    echo "<p><strong>$setting:</strong> $value</p>";
}

// Test 4: Proxy URL simulation
echo "<h3>4. Proxy URL Test</h3>";
$testUrls = [
    '/graphics/photo-5472949',
    '/web-templates/business-2847362',
    '/download/photo-5472949'
];

foreach ($testUrls as $testPath) {
    $targetURL = 'https://elements.envato.com' . $testPath;
    echo "<p><strong>Test Path:</strong> $testPath</p>";
    echo "<p><strong>Target URL:</strong> $targetURL</p>";
    echo "<p><strong>Proxy URL:</strong> <a href='proxy.php?path=$testPath' target='_blank'>proxy.php$testPath</a></p>";
    echo "<hr>";
}

// Test 5: Check file permissions
echo "<h3>5. File Permissions</h3>";
$files = ['proxy.php', 'cookies.txt', 'debug.php'];
foreach ($files as $file) {
    if (file_exists($file)) {
        $perms = fileperms($file);
        $readable = is_readable($file) ? 'Yes' : 'No';
        $writable = is_writable($file) ? 'Yes' : 'No';
        echo "<p><strong>$file:</strong> Readable: $readable, Writable: $writable, Permissions: " . decoct($perms & 0777) . "</p>";
    } else {
        echo "<p><strong>$file:</strong> <span style='color: red;'>File not found</span></p>";
    }
}

echo "<h3>Instructions</h3>";
echo "<ol>";
echo "<li>Open your browser and go to <a href='https://elements.envato.com' target='_blank'>Envato Elements</a></li>";
echo "<li>Log in to your account</li>";
echo "<li>Open Developer Tools (F12) → Application → Cookies → elements.envato.com</li>";
echo "<li>Copy all cookie values and paste them into cookies.txt file in this format: name1=value1; name2=value2; ...</li>";
echo "<li>Try accessing content through the proxy: <a href='proxy.php/graphics' target='_blank'>proxy.php/graphics</a></li>";
echo "</ol>";
?>