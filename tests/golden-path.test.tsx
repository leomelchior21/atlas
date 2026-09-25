// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AtlasShell } from "@/components/AtlasShell";
import { AtlasProvider, __resetAtlasStore } from "@/store/atlas-store";

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16) as unknown as number,
  );
  vi.stubGlobal("cancelAnimationFrame", (handle: number) => clearTimeout(handle));
});

beforeEach(() => {
  window.localStorage.clear();
  __resetAtlasStore();
});

afterEach(() => {
  cleanup();
});

async function enterAtlas() {
  render(
    <AtlasProvider>
      <AtlasShell />
    </AtlasProvider>,
  );
  await waitFor(() => expect(screen.getByLabelText("Seu nome")).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Marina" } });
  fireEvent.click(screen.getByText("CONTINUAR"));
  fireEvent.click(await screen.findByRole("radio", { name: "8º ANO" }));
  fireEvent.click(screen.getByText("ENTRAR NO ATLAS"));
  await waitFor(() => expect(screen.getByText("MATEMÁTICA")).toBeTruthy());
}

/** only the nodes drawn on the map, not the contextual panel entries */
async function mapNode(name: RegExp): Promise<Element> {
  return await waitFor(
    () => {
      const match = screen
        .getAllByRole("button", { name })
        .find((element) => element.tagName.toLowerCase() === "g");
      if (!match) throw new Error(`nó do mapa não encontrado: ${name}`);
      return match;
    },
    { timeout: 9000 },
  );
}

function conceptLink() {
  return screen.getByRole("navigation", { name: "Percurso do conceito" });
}

describe("caminho principal", () => {
  it("leva do onboarding até a maratona de Pitágoras", async () => {
    await enterAtlas();

    expect(screen.getByText("FÍSICA")).toBeTruthy();
    expect(screen.getByText("QUÍMICA")).toBeTruthy();
    expect(screen.getByText("ENCONTRE SUA ILHA")).toBeTruthy();

    // nível 0 → 1: a ilha revela os territórios
    fireEvent.click(screen.getByRole("button", { name: /MATEMÁTICA/ }));
    const geometry = await mapNode(/^GEOMETRIA/);

    // nível 1 → 2: o território revela os conceitos
    fireEvent.click(geometry);
    const pythagoras = await mapNode(/^Pitágoras/);

    // nível 2 → conceito: o seletor oferece exatamente duas portas
    fireEvent.click(pythagoras);
    const conceptButton = await screen.findByText("CONCEITO");
    expect(screen.getByText("MARATONA")).toBeTruthy();

    // CONCEITO: experiência interativa
    fireEvent.click(conceptButton);
    await waitFor(() => expect(screen.getByText("TEOREMA DE PITÁGORAS")).toBeTruthy());
    expect(within(conceptLink()).getByText("EXPLORAR")).toBeTruthy();
    expect(within(conceptLink()).getByText("ENTENDER")).toBeTruthy();
    expect(within(conceptLink()).getByText("APLICAÇÕES")).toBeTruthy();
    expect(screen.getByText("ARRASTE OS PONTOS")).toBeTruthy();

    // a demonstração responde ao percurso
    fireEvent.click(within(conceptLink()).getByText("ENTENDER"));
    expect(screen.getByLabelText("Transformar a demonstração")).toBeTruthy();

    // volta ao seletor e entra na MARATONA
    fireEvent.click(screen.getByRole("button", { name: "CONCEITO" }));
    fireEvent.click(await screen.findByText("MARATONA"));

    const group = await screen.findByRole("group", { name: "Alternativas" });
    const alternatives = within(group).getAllByRole("button");
    expect(alternatives.length).toBeGreaterThanOrEqual(2);
    expect(alternatives.length).toBeLessThanOrEqual(5);
    expect(screen.getByText("PRÓXIMA")).toBeTruthy();
    expect(screen.getByText("DICA")).toBeTruthy();

    // responde: feedback calmo, sem tela de comemoração
    fireEvent.click(alternatives[0]);
    await waitFor(() => expect(screen.getByText(/CORRETO|REVEJA/)).toBeTruthy());

    const next = screen.getByText("PRÓXIMA").closest("button") as HTMLButtonElement;
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    await waitFor(() => expect(screen.queryByText(/CORRETO|REVEJA/)).toBeNull());
  }, 60000);

  it("persiste perfil e XP no armazenamento local", async () => {
    await enterAtlas();
    const raw = window.localStorage.getItem("atlas.progress.v1");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.student.name).toBe("Marina");
    expect(parsed.student.year).toBe(8);
    expect(typeof parsed.xp).toBe("number");
  }, 40000);

  it("revela ramificações e mostra o território em mapeamento", async () => {
    await enterAtlas();

    fireEvent.click(screen.getByRole("button", { name: /MATEMÁTICA/ }));
    fireEvent.click(await mapNode(/^GEOMETRIA/));
    fireEvent.click(await mapNode(/^Triângulos/));

    // o seletor permite descer para os ramos do território
    fireEvent.click(await screen.findByText("EXPLORAR RAMIFICAÇÕES →"));
    fireEvent.click(await mapNode(/^Classificação/));

    await waitFor(() =>
      expect(screen.getByText("ESTE TERRITÓRIO AINDA ESTÁ SENDO MAPEADO.")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("← VOLTAR AO ATLAS"));
    await waitFor(() => expect(screen.getByText("MATEMÁTICA")).toBeTruthy());
  }, 60000);

  it("mantém o mapa utilizável com movimento reduzido", async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    await enterAtlas();
    expect(screen.getByText("ENCONTRE SUA ILHA")).toBeTruthy();
  }, 40000);
});
