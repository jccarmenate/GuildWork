import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useDocumentTitle } from "../src/hooks/useDocumentTitle";

function TitleSetter({ title }: { title: string }) {
  useDocumentTitle(title);
  return null;
}

describe("useDocumentTitle", () => {
  it("sets document.title suffixed with the app name", () => {
    render(<TitleSetter title="Dashboard" />);
    expect(document.title).toBe("Dashboard · GuildWork");
  });

  it("updates document.title when the value changes", () => {
    const { rerender } = render(<TitleSetter title="Dashboard" />);
    rerender(<TitleSetter title="Projects" />);
    expect(document.title).toBe("Projects · GuildWork");
  });
});
