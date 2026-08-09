/**
 * Group naming in the object tree.
 *
 * Layers and objects could be renamed; groups showed a derived "Group (n)" and had no way
 * to be named at all. A group is not an element — it exists only as an id shared by its
 * members' `groupIds` — so the name is stored on the MEMBERS (`groupNames`, keyed by group
 * id). These cover the read side: which member answers, and what the tree label falls back
 * to. The write side (`setGroupName`) keeps every member's entry in step.
 */

import { describe, it, expect } from "bun:test";
import { groupLabel, groupNameOf } from "./object-label";
import type { DrawingElement } from "../types";

const member = (id: string, groupIds: string[], groupNames?: Record<string, string>): DrawingElement =>
    ({ id, type: "rectangle", x: 0, y: 0, width: 10, height: 10, groupIds, groupNames } as any);

describe("groupLabel", () => {
    it("falls back to the member count when the group has no name", () => {
        expect(groupLabel(3)).toBe("Group (3)");
        expect(groupLabel(3, undefined)).toBe("Group (3)");
    });

    it("prefers the user's name", () => {
        expect(groupLabel(3, "Coffee box — front")).toBe("Coffee box — front");
    });

    it("treats a blank name as no name, so the row never goes empty", () => {
        expect(groupLabel(2, "   ")).toBe("Group (2)");
        expect(groupLabel(2, "")).toBe("Group (2)");
    });

    it("trims, so a stray space doesn't shift the row", () => {
        expect(groupLabel(2, "  Lid  ")).toBe("Lid");
    });
});

describe("groupNameOf", () => {
    const G = "g1";

    it("reads the name off any member", () => {
        const members = [member("a", [G], { [G]: "Lid" }), member("b", [G], { [G]: "Lid" })];
        expect(groupNameOf(members, G)).toBe("Lid");
    });

    it("answers from a later member when the first has no entry", () => {
        const members = [member("a", [G]), member("b", [G], { [G]: "Lid" })];
        expect(groupNameOf(members, G)).toBe("Lid");
    });

    it("is undefined for an unnamed group", () => {
        expect(groupNameOf([member("a", [G]), member("b", [G])], G)).toBeUndefined();
    });

    it("ignores a stale entry on an element that has left the group", () => {
        // Ungroup+regroup can leave the old name behind on an element that no longer
        // carries the id; it must not resurrect the name for a different group.
        const left = member("a", ["other"], { [G]: "Old name" });
        expect(groupNameOf([left], G)).toBeUndefined();
    });

    it("only answers for the group asked about", () => {
        const m = member("a", ["g1", "g2"], { g1: "Inner", g2: "Outer" });
        expect(groupNameOf([m], "g1")).toBe("Inner");
        expect(groupNameOf([m], "g2")).toBe("Outer");
        expect(groupNameOf([m], "g3")).toBeUndefined();
    });

    it("handles nested groups on the same element independently", () => {
        const a = member("a", ["inner", "outer"], { inner: "Cap", outer: "Bottle" });
        const b = member("b", ["inner", "outer"], { inner: "Cap", outer: "Bottle" });
        expect(groupNameOf([a, b], "inner")).toBe("Cap");
        expect(groupNameOf([a, b], "outer")).toBe("Bottle");
    });

    it("skips a whitespace-only entry rather than showing a blank row", () => {
        const members = [member("a", [G], { [G]: "   " }), member("b", [G], { [G]: "Lid" })];
        expect(groupNameOf(members, G)).toBe("Lid");
    });

    it("is undefined for an empty member list", () => {
        expect(groupNameOf([], G)).toBeUndefined();
    });
});
