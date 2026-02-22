/**
 * DSL Adapter Interface
 * Base interface for all format adapters that convert external diagram formats
 * (Mermaid, PlantUML, etc.) into the YappyDraw DSL Intermediate Representation.
 */

import type { DSLDiagram, ParseError } from '../types';

export interface AdapterResult {
    success: boolean;
    diagram?: DSLDiagram;
    errors: ParseError[];
    warnings: ParseError[];
}

export interface DSLAdapter {
    /** Unique adapter name (e.g. 'mermaid', 'plantuml') */
    name: string;

    /** Check if this adapter can handle the given input */
    canParse(input: string): boolean;

    /** Parse the input into a DSL diagram IR */
    parse(input: string): AdapterResult;
}
