import { describe, expect, it } from "vitest";
import { parsePagination } from "../../src/lib/pagination.js";

describe("parsePagination", () => {
  it("defaults to page 1 and pageSize 25 when no query params are given", () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 25 });
  });

  it("parses valid numeric strings from query params", () => {
    expect(parsePagination({ page: "3", pageSize: "10" })).toEqual({ page: 3, pageSize: 10 });
  });

  it("clamps pageSize to a maximum of 100", () => {
    expect(parsePagination({ pageSize: "9999" })).toEqual({ page: 1, pageSize: 100 });
  });

  it("clamps page to a minimum of 1", () => {
    expect(parsePagination({ page: "0" })).toEqual({ page: 1, pageSize: 25 });
    expect(parsePagination({ page: "-5" })).toEqual({ page: 1, pageSize: 25 });
  });

  it("falls back to defaults for non-numeric junk", () => {
    expect(parsePagination({ page: "abc", pageSize: "xyz" })).toEqual({ page: 1, pageSize: 25 });
  });
});
