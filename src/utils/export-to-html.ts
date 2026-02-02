import type { SlideDocument } from "../types/slide-types";
import { PLAYER_JS, PLAYER_CSS } from "../assets/player-assets";

/**
 * Converts a Blob URL to a Base64 string
 */
const blobUrlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn(`Failed to convert ${url} to base64`, e);
        return url; // Return original if failure
    }
};

/**
 * Traverses the document and embeds all images as Base64
 */
const embedImages = async (doc: SlideDocument): Promise<SlideDocument> => {
    // Clone doc to avoid mutating original
    const newDoc = JSON.parse(JSON.stringify(doc));

    // 1. Process Elements (Image shapes)
    for (const el of newDoc.elements) {
        if (el.type === 'image' && el.src && el.src.startsWith('blob:')) {
            el.src = await blobUrlToBase64(el.src);
        }
    }

    // 2. Process Slide Backgrounds (if they use images)
    for (const slide of newDoc.slides) {
        if (slide.background?.type === 'image' && slide.background.url?.startsWith('blob:')) {
            slide.background.url = await blobUrlToBase64(slide.background.url);
        }
    }

    return newDoc;
};

export const exportToHtml = async (doc: SlideDocument, filename: string) => {
    // 1. Prepare data with embedded assets
    const processedDoc = await embedImages(doc);
    const flags = {
        isStandalone: true,
        generatedAt: new Date().toISOString()
    };

    // 2. Construct HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${processedDoc.metadata.name || 'Presentation'} - Yappy</title>
    <style>
        /* Reset and Base Styles */
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        
        /* Player CSS */
        ${PLAYER_CSS}
        
        /* Loading Screen */
        #loader {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: #1e293b; color: white; display: flex;
            align-items: center; justify-content: center;
            font-family: system-ui, sans-serif; z-index: 9999;
            transition: opacity 0.5s;
        }
    </style>
</head>
<body>
    <div id="loader">Loading Presentation...</div>
    <div id="root"></div>

    <script>
        window.__PRESENTATION_DATA__ = ${JSON.stringify(processedDoc)};
        window.__YAPPY_FLAGS__ = ${JSON.stringify(flags)};
        
        // Hide loader when app mounts (can be triggered by app)
        window.addEventListener('load', () => {
             // Fallback if app doesn't hide it
             setTimeout(() => {
                 const loader = document.getElementById('loader');
                 if(loader) loader.style.opacity = '0';
                 setTimeout(() => loader?.remove(), 500);
             }, 1000);
        });
    </script>
    
    <script type="module">
        ${PLAYER_JS}
    </script>
</body>
</html>`;

    // 3. Download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
