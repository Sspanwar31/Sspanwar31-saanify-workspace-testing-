import { NextRequest, NextResponse } from 'next/server'
import GitHubIntegration from '@/components/github/GitHubIntegration'

export async function GET() {
  try {
    // Return to GitHub integration component as HTML with secure iframe policies
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Integration - Saanify</title>
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' 
        https://cdn.tailwindcss.com 
        https://unpkg.com/react@18/umd/react.production.min.js
        https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
        https://unpkg.com/framer-motion@10/dist/framer-motion.umd.js
        https://unpkg.com/lucide@latest/dist/umd/lucide.js;
      style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://api.github.com;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    ">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.umd.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px 16px 0 0;
        }
        .logo { 
            font-size: 2.5rem; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .integration-content {
            padding: 30px;
            min-height: 400px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2rem;
            color: #666;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Security: Prevent iframes and external content */
        iframe, object, embed {
            display: none !important;
        }
        
        /* Secure any dynamically created content */
        [data-external], [data-iframe] {
            display: none !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔗 Saanify</div>
            <div style="font-size: 1.2rem; opacity: 0.9;">GitHub Integration</div>
        </div>
        <div class="integration-content">
            <div class="loading">
                <div class="spinner"></div>
                <div>Loading GitHub Integration...</div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #888;">
                    Setting up your GitHub repository connection
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Security: Prevent iframe injection
        (function() {
            'use strict';
            
            // Override createElement to prevent iframe creation
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                if (tagName.toLowerCase() === 'iframe') {
                    console.warn('Blocked iframe creation for security');
                    return document.createElement('div'); // Return safe element
                }
                return element;
            };
            
            // Prevent dynamic script injection
            const originalWrite = document.write;
            document.write = function(content) {
                // Check for iframe patterns
                if (content && content.toLowerCase().includes('<iframe')) {
                    console.warn('Blocked iframe injection via document.write');
                    return;
                }
                return originalWrite.call(this, content);
            };
            
            // Monitor for dynamically added iframes
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'IFRAME' || node.tagName === 'OBJECT' || node.tagName === 'EMBED') {
                                console.warn('Removed potentially unsafe element:', node.tagName);
                                node.remove();
                            }
                            
                            // Check for iframes within added nodes
                            const iframes = node.querySelectorAll ? node.querySelectorAll('iframe, object, embed') : [];
                            iframes.forEach(function(iframe) {
                                console.warn('Removed potentially unsafe nested element:', iframe.tagName);
                                iframe.remove();
                            });
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        })();
        
        // Auto-close after successful setup or after timeout
        setTimeout(() => {
            window.close();
        }, 30000); // Close after 30 seconds if nothing happens
        
        // Listen for messages from parent
        window.addEventListener('message', function(event) {
            if (event.data === 'close') {
                window.close();
            }
        });
        
        // Set secure window properties
        Object.defineProperty(window, 'frameElement', {
            value: null,
            writable: false
        });
    </script>
</body>
</html>
    `
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com; frame-src 'none'; object-src 'none';",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), payment=(), clipboard-write=(), web-share=(), publickey-credentials-get=(), publickey-credentials-create=(), fullscreen=(), accelerometer=(), gyroscope=(), magnetometer=(), geolocation=()'
      },
    })
  } catch (error) {
    console.error('Error serving GitHub integration:', error)
    return NextResponse.json(
      { error: 'Failed to load GitHub integration' },
      { status: 500 }
    )
  }
}