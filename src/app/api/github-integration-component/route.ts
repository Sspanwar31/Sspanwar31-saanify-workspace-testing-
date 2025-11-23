import { NextRequest, NextResponse } from 'next/server'
import GitHubIntegration from '@/components/github/GitHubIntegration'

export async function GET() {
  try {
    // Return the GitHub integration component as HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Integration - Saanify</title>
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
    </script>
</body>
</html>
    `
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
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