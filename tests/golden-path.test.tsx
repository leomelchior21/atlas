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

/** only the nodes drawn on the map, never the panel entries */
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

const panel = () => screen.getByLabelText(/^Detalhes de/);
const journey = () => screen.getByRole("navigation", { name: "Percurso do conceito" });

describe("caminho principal", () => {
  it("leva do onboarding até a maratona de Pitágoras", async () => {
    await enterAtlas();

    // visão geral: apenas as três ilhas, sem painel
    expect(screen.getByText("FÍSICA")).toBeTruthy();
    expect(screen.getByText("QUÍMICA")).toBeTruthy();
    expect(screen.getByText("ENCONTRE SUA ILHA")).toBeTruthy();
    expect(screen.queryByLabelText(/^Detalhes de/)).toBeNull();

    // ilha → territórios
    fireEvent.click(screen.getByRole("button", { name: /MATEMÁTICA/ }));
    const geometry = await mapNode(/^GEOMETRIA/);
    expect(within(panel()).getByText("NÚMEROS")).toBeTruthy();

    // território → conceitos
    fireEvent.click(geometry);
    const pythagoras = await mapNode(/^Pitágoras/);
    expect(within(panel()).getByText("Triângulos")).toBeTruthy();

    // conceito → tela de entrada (uma representação, duas portas)
    fireEvent.click(pythagoras);
    fireEvent.click(await screen.findByText("ABRIR CONCEITO"));
    await waitFor(() => expect(screen.getByText("DOMÍNIO")).toBeTruthy());
    expect(screen.getByText("MARATONA")).toBeTruthy();

    // CONCEITO: experiência interativa
    fireEvent.click(screen.getByText("CONCEITO"));
    await waitFor(() => expect(screen.getByText("TEOREMA DE PITÁGORAS")).toBeTruthy());
    expect(within(journey()).getByText("EXPLORAR")).toBeTruthy();
    expect(within(journey()).getByText("ENTENDER")).toBeTruthy();
    expect(within(journey()).getByText("APLICAÇÕES")).toBeTruthy();
    expect(screen.getByText("ARRASTE OS PONTOS")).toBeTruthy();

    fireEvent.click(within(journey()).getByText("ENTENDER"));
    expect(screen.getByLabelText("Transformar a demonstração")).toBeTruthy();

    // volta para a entrada e entra na MARATONA
    fireEvent.click(screen.getByRole("button", { name: "CONCEITO" }));
    fireEvent.click(await screen.findByText("MARATONA"));

    const group = await screen.findByRole("group", { name: "Alternativas" });
    const alternatives = within(group).getAllByRole("button");
    expect(alternatives.length).toBeGreaterThanOrEqual(2);
    expect(alternatives.length).toBeLessThanOrEqual(5);
    expect(screen.getByText("DICA")).toBeTruthy();

    // responde: confirmação discreta, sem tela de comemoração
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

  it("mostra o território em mapeamento", async () => {
    await enterAtlas();

    fireEvent.click(screen.getByRole("button", { name: /MATEMÁTICA/ }));
    fireEvent.click(await mapNode(/^GEOMETRIA/));
    fireEvent.click(await mapNode(/^Polígonos/));
    fireEvent.click(await mapNode(/^Classificação/));

    fireEvent.click(await within(panel()).findByText("ABRIR"));
    await waitFor(() =>
      expect(screen.getByText("ESTE TERRITÓRIO AINDA ESTÁ SENDO MAPEADO.")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("← VOLTAR AO ATLAS"));
    await waitFor(() => expect(screen.getAllByText("MATEMÁTICA").length).toBeGreaterThan(0));
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
