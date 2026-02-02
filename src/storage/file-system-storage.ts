import type { StorageInterface, DrawingData, DocumentData, SlideDocument } from "./storage-interface";
import { isSlideDocument } from "./storage-interface";
import { migrateToSlideFormat } from "../utils/migration";

export class FileSystemStorage implements StorageInterface {
    private baseUrl = '/api/drawings';

    async saveDrawing(id: string, data: DrawingData | SlideDocument): Promise<void> {
        let payload: SlideDocument;

        if (isSlideDocument(data)) {
            // Already v3 format - just update timestamp
            payload = {
                ...data,
                metadata: {
                    ...data.metadata,
                    updatedAt: new Date().toISOString()
                }
            };
        } else {
            // Legacy v2 format - convert to v3
            payload = migrateToSlideFormat(data);
        }

        // Auto-upgrade logic: Convert all legacy points to flat format on save
        if (payload.version === 4 && payload.elements) {
            payload.elements = payload.elements.map(el => {
                if ((el.type === 'fineliner' || el.type === 'inkbrush' || el.type === 'marker') && el.points && typeof el.points[0] !== 'number') {
                    const flatPoints: number[] = [];
                    (el.points as any[]).forEach(p => {
                        flatPoints.push(p.x, p.y);
                    });
                    return { ...el, points: flatPoints, pointsEncoding: 'flat' as const };
                }
                return el;
            });
        }

        if (payload.slides) {
            payload.slides = payload.slides.map(slide => {
                const updatedSlide = { ...slide };
                // Version 3 format had elements PER slide
                if ((updatedSlide as any).elements) {
                    (updatedSlide as any).elements = (updatedSlide as any).elements.map((el: any) => {
                        if ((el.type === 'fineliner' || el.type === 'inkbrush' || el.type === 'marker') && el.points && typeof el.points[0] !== 'number') {
                            const flatPoints: number[] = [];
                            (el.points as any[]).forEach((p: any) => {
                                flatPoints.push(p.x, p.y);
                            });
                            return { ...el, points: flatPoints, pointsEncoding: 'flat' as const };
                        }
                        return el;
                    });
                }
                return updatedSlide;
            });
        }

        // Compress using GZIP for storage
        const jsonString = JSON.stringify(payload);
        const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
        const compressedResponse = new Response(stream);
        const blob = await compressedResponse.blob();

        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/gzip',
            },
            body: blob,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(error.error || `Failed to save: ${response.statusText}`);
        }
    }

    async loadDrawing(id: string): Promise<DocumentData | null> {
        const response = await fetch(`${this.baseUrl}/${id}`);
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type');
        let jsonString: string;

        if (contentType && (contentType.includes('application/gzip') || contentType.includes('application/x-gzip') || contentType.includes('application/octet-stream'))) {
            try {
                // Decompress
                const ds = new DecompressionStream('gzip');
                const decompressedStream = response.body!.pipeThrough(ds);
                const decompressedResponse = new Response(decompressedStream);
                jsonString = await decompressedResponse.text();
            } catch (e) {
                console.warn('Decompression failed, falling back to text', e);
                jsonString = await response.text();
            }
        } else {
            jsonString = await response.text();
        }

        return JSON.parse(jsonString);
    }

    async listDrawings(): Promise<string[]> {
        const response = await fetch(this.baseUrl);
        if (!response.ok) return [];
        return await response.json();
    }

    async deleteDrawing(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error(error.error || `Failed to delete: ${response.statusText}`);
        }
    }
}

export const storage = new FileSystemStorage();
