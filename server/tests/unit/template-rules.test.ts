import { describe, expect, it } from "vitest";
import { templateInput } from "../../src/features/templates/rules.js";

describe("TEST-F02-02: template validation boundaries", () => {
  const input = { title: " Read ", minMinutes: 1, maxMinutes: 1440 };
  it("normalizes whitespace, defaults description, and counts Unicode code points", () => {
    expect(templateInput.parse(input)).toMatchObject({
      title: "Read",
      description: "",
    });
    expect(
      templateInput.safeParse({
        ...input,
        title: "📚".repeat(100),
        description: "📚".repeat(500),
      }).success,
    ).toBe(true);
    expect(
      templateInput.safeParse({ ...input, title: "📚".repeat(101) }).success,
    ).toBe(false);
    expect(
      templateInput.safeParse({ ...input, description: "x".repeat(501) })
        .success,
    ).toBe(false);
  });
  it.each([0, -1, 1441, 1.5, "60", true, null, undefined])(
    "rejects invalid lower bound %s without coercion",
    (minMinutes) => {
      expect(templateInput.safeParse({ ...input, minMinutes }).success).toBe(
        false,
      );
    },
  );
  it("accepts inclusive endpoints and rejects reversed range/unknown server fields", () => {
    for (const n of [1, 1440])
      expect(
        templateInput.safeParse({ ...input, minMinutes: n, maxMinutes: n })
          .success,
      ).toBe(true);
    expect(
      templateInput.safeParse({ ...input, minMinutes: 60, maxMinutes: 30 })
        .success,
    ).toBe(false);
    expect(templateInput.safeParse({ ...input, title: "  " }).success).toBe(
      false,
    );
    expect(templateInput.safeParse({ ...input, unit: "MINUTES" }).success).toBe(
      false,
    );
  });
});
