import type { Template, TemplateCategory, CategoryInfo } from '../types/template-types';
import * as diagramTemplates from './data/diagrams';
import * as dslExamples from './data/dsl-examples';

/**
 * Template Registry
 * Central registry for all templates with category-based organization
 */
class TemplateRegistry {
    private templates: Map<string, Template> = new Map();
    private categoriesInfo: Map<TemplateCategory, CategoryInfo> = new Map();

    constructor() {
        this.initializeCategories();
        this.registerDefaultTemplates();
    }

    /**
     * Initialize category metadata
     */
    private initializeCategories() {
        this.categoriesInfo.set('diagrams', {
            id: 'diagrams',
            name: 'Diagrams',
            description: 'Flowcharts, mind maps, and technical diagrams'
        });

        this.categoriesInfo.set('wireframes', {
            id: 'wireframes',
            name: 'Wireframes',
            description: 'UI wireframes and mockups'
        });

        this.categoriesInfo.set('sketchnotes', {
            id: 'sketchnotes',
            name: 'Sketch Notes',
            description: 'Hand-drawn style notes and doodles'
        });

        this.categoriesInfo.set('animations', {
            id: 'animations',
            name: 'Animations',
            description: 'Animated diagrams and sequences'
        });

        this.categoriesInfo.set('dsl-examples', {
            id: 'dsl-examples',
            name: 'Text Diagrams',
            description: 'Diagrams from YSL and Mermaid text syntax'
        });
    }

    /**
     * Register all default templates
     */
    private registerDefaultTemplates() {
        // Register diagram templates
        this.registerTemplate(diagramTemplates.flowchartTemplate);
        this.registerTemplate(diagramTemplates.mindmapTemplate);
        this.registerTemplate(diagramTemplates.wireframeTemplate);
        this.registerTemplate(diagramTemplates.orgChartTemplate);
        this.registerTemplate(diagramTemplates.networkDiagramTemplate);
        this.registerTemplate(diagramTemplates.systemDesignTemplate);
        this.registerTemplate(diagramTemplates.yappyArchitectureTemplate);

        // Register DSL example templates — YSL
        this.registerTemplate(dslExamples.yslFlowchartTemplate);
        this.registerTemplate(dslExamples.yslMindmapTemplate);
        this.registerTemplate(dslExamples.yslInfrastructureTemplate);
        this.registerTemplate(dslExamples.yslSequenceTemplate);
        this.registerTemplate(dslExamples.yslDecisionTreeTemplate);
        this.registerTemplate(dslExamples.yslDataStructuresTemplate);
        this.registerTemplate(dslExamples.yslHorizontalFlowchartTemplate);
        this.registerTemplate(dslExamples.yslBpmnProcessTemplate);
        this.registerTemplate(dslExamples.yslBpmnPoolsTemplate);
        this.registerTemplate(dslExamples.yslUmlClassTemplate);
        this.registerTemplate(dslExamples.yslStyledFlowchartTemplate);
        this.registerTemplate(dslExamples.yslRadialTemplate);
        this.registerTemplate(dslExamples.yslEdgeTypesTemplate);
        this.registerTemplate(dslExamples.yslBottomUpTreeTemplate);
        this.registerTemplate(dslExamples.yslShapesShowcaseTemplate);
        // Register DSL example templates — Mermaid
        this.registerTemplate(dslExamples.mermaidFlowchartTemplate);
        this.registerTemplate(dslExamples.mermaidSequenceTemplate);
        this.registerTemplate(dslExamples.mermaidClassTemplate);
        this.registerTemplate(dslExamples.mermaidPieTemplate);
        this.registerTemplate(dslExamples.mermaidMindmapTemplate);
        this.registerTemplate(dslExamples.mermaidERTemplate);
        this.registerTemplate(dslExamples.mermaidStyledTemplate);
        this.registerTemplate(dslExamples.mermaidStateTemplate);
        this.registerTemplate(dslExamples.mermaidGanttTemplate);
        this.registerTemplate(dslExamples.mermaidJourneyTemplate);
        this.registerTemplate(dslExamples.mermaidQuadrantTemplate);
        this.registerTemplate(dslExamples.mermaidXYChartTemplate);
        this.registerTemplate(dslExamples.mermaidBlockTemplate);
        this.registerTemplate(dslExamples.mermaidGitGraphTemplate);
    }

    /**
     * Register a new template
     */
    registerTemplate(template: Template): void {
        this.templates.set(template.metadata.id, template);
    }

    /**
     * Get template by ID
     */
    getTemplateById(id: string): Template | undefined {
        return this.templates.get(id);
    }

    /**
     * Get all templates for a category
     */
    getTemplatesByCategory(category: TemplateCategory): Template[] {
        const templates = Array.from(this.templates.values())
            .filter(t => t.metadata.category === category)
            .sort((a, b) => (a.metadata.order || 999) - (b.metadata.order || 999));

        return templates;
    }

    /**
     * Get all available categories
     */
    getAllCategories(): CategoryInfo[] {
        return Array.from(this.categoriesInfo.values());
    }

    /**
     * Get categories that have templates
     */
    getActiveCategories(): CategoryInfo[] {
        const activeCategories = new Set<TemplateCategory>();

        this.templates.forEach(template => {
            activeCategories.add(template.metadata.category);
        });

        return Array.from(activeCategories)
            .map(cat => this.categoriesInfo.get(cat)!)
            .filter(Boolean);
    }

    /**
     * Search templates by name or tags
     */
    searchTemplates(query: string): Template[] {
        const lowercaseQuery = query.toLowerCase();

        return Array.from(this.templates.values()).filter(template => {
            const matchesName = template.metadata.name.toLowerCase().includes(lowercaseQuery);
            const matchesDescription = template.metadata.description.toLowerCase().includes(lowercaseQuery);
            const matchesTags = template.metadata.tags.some(tag =>
                tag.toLowerCase().includes(lowercaseQuery)
            );

            return matchesName || matchesDescription || matchesTags;
        });
    }

    /**
     * Get all templates
     */
    getAllTemplates(): Template[] {
        return Array.from(this.templates.values());
    }
}

// Singleton instance
export const templateRegistry = new TemplateRegistry();

// Export helpers
export const getTemplateById = (id: string) => templateRegistry.getTemplateById(id);
export const getTemplatesByCategory = (category: TemplateCategory) =>
    templateRegistry.getTemplatesByCategory(category);
export const getAllCategories = () => templateRegistry.getAllCategories();
export const getActiveCategories = () => templateRegistry.getActiveCategories();
export const searchTemplates = (query: string) => templateRegistry.searchTemplates(query);
export const registerTemplate = (template: Template) => templateRegistry.registerTemplate(template);
