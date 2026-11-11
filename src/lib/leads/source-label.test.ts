import { describe, expect, it } from "vitest";
import { sourceLabel, stripLpSuffix } from "./source-label";

describe("sourceLabel", () => {
  it("corrige marcas conhecidas", () => {
    expect(sourceLabel("whatsapp")).toBe("WhatsApp");
    expect(sourceLabel("Instagram")).toBe("Instagram");
    expect(sourceLabel("instagram")).toBe("Instagram");
    expect(sourceLabel("LINKEDIN")).toBe("LinkedIn");
    expect(sourceLabel("youtube")).toBe("YouTube");
  });
  it("formata origens desconhecidas", () => {
    expect(sourceLabel("parceiro_abc")).toBe("Parceiro Abc");
  });
  it("vazio vira null", () => {
    expect(sourceLabel("")).toBeNull();
    expect(sourceLabel(null)).toBeNull();
  });
});

describe("stripLpSuffix", () => {
  it("remove o sufixo da landing page", () => {
    expect(stripLpSuffix("Grupo Zimmermann — LP Data Scanner")).toBe("Grupo Zimmermann");
    expect(stripLpSuffix("Proposta anual")).toBe("Proposta anual");
  });
});
