<?php
// Test script to check .htaccess functionality
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Apache .htaccess Test</h2>";

// Test 1: Check if mod_rewrite is enabled
echo "<h3>1. Apache Modules</h3>";
if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    if (in_array('mod_rewrite', $modules)) {
        echo "<p style='color: green;'>✅ mod_rewrite is enabled</p>";
    } else {
        echo "<p style='color: red;'>❌ mod_rewrite is NOT enabled</p>";
    }
    
    if (in_array('mod_headers', $modules)) {
        echo "<p style='color: green;'>✅ mod_headers is enabled</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ mod_headers is not enabled (optional but recommended)</p>";
    }
} else {
    echo "<p style='color: orange;'>⚠️ Cannot check Apache modules (function not available)</p>";
}

// Test 2: Check server variables
echo "<h3>2. Server Environment</h3>";
$serverVars = [
    'REQUEST_URI',
    'SCRIPT_NAME', 
    'QUERY_STRING',
    'REQUEST_METHOD',
    'HTTP_HOST',
    'SERVER_NAME',
    'DOCUMENT_ROOT'
];

foreach ($serverVars as $var) {
    $value = $_SERVER[$var] ?? 'Not set';
    echo "<p><strong>$var:</strong> $value</p>";
}

// Test 3: Check if .htaccess is being read
echo "<h3>3. .htaccess Status</h3>";
if (file_exists('.htaccess')) {
    echo "<p style='color: green;'>✅ .htaccess file exists</p>";
    $htaccessContent = file_get_contents('.htaccess');
    echo "<p>File size: " . strlen($htaccessContent) . " bytes</p>";
    
    // Check for key directives
    if (strpos($htaccessContent, 'RewriteEngine On') !== false) {
        echo "<p style='color: green;'>✅ RewriteEngine is enabled in .htaccess</p>";
    } else {
        echo "<p style='color: red;'>❌ RewriteEngine not found in .htaccess</p>";
    }
} else {
    echo "<p style='color: red;'>❌ .htaccess file not found</p>";
}

// Test 4: Check PHP settings applied by .htaccess
echo "<h3>4. PHP Settings</h3>";
$phpSettings = [
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size')
];

foreach ($phpSettings as $setting => $value) {
    echo "<p><strong>$setting:</strong> $value</p>";
}

// Test 5: Test URL rewriting
echo "<h3>5. URL Rewrite Test</h3>";
echo "<p>Current URL: " . $_SERVER['REQUEST_URI'] . "</p>";
echo "<p>Script name: " . $_SERVER['SCRIPT_NAME'] . "</p>";

if ($_SERVER['REQUEST_URI'] === '/test.php') {
    echo "<p style='color: green;'>✅ Direct access to test.php works</p>";
} else {
    echo "<p style='color: orange;'>ℹ️ Accessed via rewrite rule</p>";
}

// Test 6: Test links
echo "<h3>6. Test Links</h3>";
echo "<p>Try these test URLs:</p>";
echo "<ul>";
echo "<li><a href='/test.php' target='_blank'>Direct test.php access</a></li>";
echo "<li><a href='/debug.php' target='_blank'>Debug page</a></li>";
echo "<li><a href='/graphics' target='_blank'>Proxy test: /graphics</a></li>";
echo "<li><a href='/photos' target='_blank'>Proxy test: /photos</a></li>";
echo "<li><a href='/web-templates' target='_blank'>Proxy test: /web-templates</a></li>";
echo "</ul>";

// Test 7: Environment variables set by .htaccess
echo "<h3>7. Environment Variables</h3>";
if (isset($_SERVER['ORIGINAL_URI'])) {
    echo "<p style='color: green;'>✅ ORIGINAL_URI is set: " . $_SERVER['ORIGINAL_URI'] . "</p>";
} else {
    echo "<p style='color: orange;'>ℹ️ ORIGINAL_URI not set (normal for direct access)</p>";
}

// Test 8: Headers test
echo "<h3>8. Headers Test</h3>";
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    echo "<p>Request headers received:</p>";
    echo "<ul>";
    foreach ($headers as $name => $value) {
        echo "<li><strong>$name:</strong> " . htmlspecialchars($value) . "</li>";
    }
    echo "</ul>";
} else {
    echo "<p>Cannot read request headers</p>";
}

// Instructions
echo "<h3>Troubleshooting Steps</h3>";
echo "<ol>";
echo "<li><strong>If mod_rewrite is disabled:</strong> Contact your hosting provider to enable it</li>";
echo "<li><strong>If .htaccess is not working:</strong> Check file permissions (should be 644)</li>";
echo "<li><strong>If PHP settings not applied:</strong> Your hosting provider may not allow .htaccess PHP directives</li>";
echo "<li><strong>If rewrites fail:</strong> Try adding 'AllowOverride All' to your Apache virtual host configuration</li>";
echo "<li><strong>Alternative .htaccess location:</strong> Some servers require .htaccess in the document root, not subdirectory</li>";
echo "</ol>";

echo "<h3>Alternative Solutions</h3>";
echo "<p>If .htaccess continues to have issues, you can:</p>";
echo "<ul>";
echo "<li>Use direct URLs like: <code>proxy.php/graphics</code> instead of <code>/graphics</code></li>";
echo "<li>Configure URL rewrites in your web server's main configuration</li>";
echo "<li>Use a different web server like Nginx with custom rewrite rules</li>";
echo "</ul>";
?>