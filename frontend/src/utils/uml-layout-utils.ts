/**
 * Shared UML layout calculations.
 * Used by renderers, selection handler, wheel handler, and text-editing handler.
 */
import type { DrawingElement } from '../types';
import type { IRenderer } from '../rendering/IRenderer';
import { measureContainerText } from './text-utils';

export interface UmlClassLayout {
    headerHeight: number;
    attrHeight: number;
    methodsHeight: number;
    attrContentHeight: number;
    methodsContentHeight: number;
    hasAttributes: boolean;
    hasMethods: boolean;
    attrOverflows: boolean;
    methodsOverflows: boolean;
}

export function calculateUmlClassLayout(renderer: IRenderer, el: DrawingElement): UmlClassLayout {
    const availWidth = el.width - 10;

    // --- Natural content heights (always needed for overflow detection) ---
    const headerText = el.containerText || '';
    let naturalHeaderHeight = 30;
    if (headerText) {
        const metrics = measureContainerText(renderer, el, headerText, availWidth);
        naturalHeaderHeight = Math.max(30, metrics.textHeight + 20);
    }

    const attrText = el.attributesText || '';
    let naturalAttrHeight = 20;
    let attrContentHeight = 0;
    if (attrText) {
        const metrics = measureContainerText(
            renderer, { ...el, fontSize: (el.fontSize || 20) * 0.9 }, attrText, availWidth
        );
        naturalAttrHeight = Math.max(20, metrics.textHeight + 10);
        attrContentHeight = metrics.textHeight + 10;
    } else if (el.type === 'umlClass') {
        naturalAttrHeight = 20;
    }

    const methodsText = el.methodsText || '';
    let methodsContentHeight = 0;
    if (methodsText) {
        const metrics = measureContainerText(
            renderer, { ...el, fontSize: (el.fontSize || 20) * 0.9 }, methodsText, availWidth
        );
        methodsContentHeight = metrics.textHeight + 10;
    }

    // --- Use persisted heights if available (fixed-size mode), otherwise auto-calculate ---
    const headerHeight = el.umlHeaderHeight ?? naturalHeaderHeight;
    const attrHeight = el.umlAttrHeight ?? naturalAttrHeight;
    const methodsHeight = Math.max(0, el.height - headerHeight - attrHeight);

    return {
        headerHeight,
        attrHeight,
        methodsHeight,
        attrContentHeight,
        methodsContentHeight,
        hasAttributes: !!attrText || el.type === 'umlClass',
        hasMethods: !!methodsText || el.type === 'umlClass',
        attrOverflows: attrContentHeight > attrHeight,
        methodsOverflows: methodsContentHeight > methodsHeight,
    };
}

/**
 * Layout for 2-section UML shapes: umlInterface, umlEnum, umlState.
 * Section 1 = header (stereotype + name), Section 2 = body (methods/values/actions).
 */
export interface Uml2SectionLayout {
    headerHeight: number;
    bodyHeight: number;
    bodyContentHeight: number;
    bodyOverflows: boolean;
}

export function calculateUml2SectionLayout(
    renderer: IRenderer,
    el: DrawingElement,
    bodyProp: 'attributesText' | 'methodsText'
): Uml2SectionLayout {
    const availWidth = el.width - 20;

    // Header: stereotype line + name
    const headerText = el.containerText || '';
    let naturalHeaderHeight = 40; // taller default for stereotype + name
    if (headerText) {
        const metrics = measureContainerText(renderer, el, headerText, availWidth);
        naturalHeaderHeight = Math.max(40, metrics.textHeight + 30); // extra for stereotype
    }

    // Body: methods/values/actions
    const bodyText = el[bodyProp] || '';
    let bodyContentHeight = 0;
    if (bodyText) {
        const metrics = measureContainerText(
            renderer, { ...el, fontSize: (el.fontSize || 20) * 0.9 }, bodyText, availWidth
        );
        bodyContentHeight = metrics.textHeight + 10;
    }

    const headerHeight = el.umlHeaderHeight ?? naturalHeaderHeight;
    const bodyHeight = Math.max(0, el.height - headerHeight);

    return {
        headerHeight,
        bodyHeight,
        bodyContentHeight,
        bodyOverflows: bodyContentHeight > bodyHeight,
    };
}
