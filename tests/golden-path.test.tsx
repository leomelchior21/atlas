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
  await waitFor(() => expect(screen.getByText("ENTRAR")).toBeTruthy());
  fireEvent.click(screen.getByText("ENTRAR"));
  await waitFor(() => expect(screen.getByLabelText("Seu nome")).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Marina" } });
  fireEvent.click(screen.getByText("CONTINUAR"));
  fireEvent.click(await screen.findByRole("radio", { name: "8º ANO" }));
  fireEvent.click(screen.getByText("ENTRAR NO ATLAS"));
  await waitFor(() => expect(screen.getByText("MATEMÁTICA")).toBeTruthy());
}

/** first match: responsive layouts render some controls twice */
const firstButton = (name: RegExp | string) => screen.getAllByRole("button", { name })[0];
const firstText = (text: string) => screen.getAllByText(text)[0];

/** walks home → Matemática → Geometria and stops at the territory */
async function openGeometry() {
  fireEvent.click(screen.getByRole("button", { name: "MATEMÁTICA" }));
  await waitFor(() => expect(screen.getByText("CONHECIMENTO EM ÓRBITA")).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: /^GEOMETRIA/ }));
  await waitFor(() => expect(screen.getAllByText("SEU PROGRESSO").length).toBeGreaterThan(0));
}

const journey = () => screen.getByRole("navigation", { name: "Percurso do conceito" });

describe("caminho principal", () => {
  it("leva da home até a maratona de Pitágoras", async () => {
    await enterAtlas();

    // home: as três matérias, nada mais
    expect(screen.getByText("FÍSICA")).toBeTruthy();
    expect(screen.getByText("QUÍMICA")).toBeTruthy();
    expect(screen.getByText("TOQUE OU APROXIME PARA EXPLORAR")).toBeTruthy();

    // matéria → territórios
    fireEvent.click(screen.getByRole("button", { name: "MATEMÁTICA" }));
    await waitFor(() => expect(screen.getByText("CONHECIMENTO EM ÓRBITA")).toBeTruthy());
    expect(firstText("NÚMEROS")).toBeTruthy();

    // território → conceitos
    fireEvent.click(screen.getByRole("button", { name: /^GEOMETRIA/ }));
    await waitFor(() => expect(screen.getAllByText("SEU PROGRESSO").length).toBeGreaterThan(0));
    expect(firstText("Ângulos")).toBeTruthy();

    // conceito → tela de entrada
    fireEvent.click(firstButton(/^Pitágoras/));
    await waitFor(() => expect(screen.getByText("DOMÍNIO")).toBeTruthy());
    expect(firstButton(/MARATONA/)).toBeTruthy();

    // CONCEITO: experiência interativa — sliders no topo, sem arrastar formas
    fireEvent.click(firstButton(/CONCEITO/));
    await waitFor(() => expect(screen.getByText("TEOREMA DE PITÁGORAS")).toBeTruthy());
    expect(within(journey()).getByText("EXPLORAR")).toBeTruthy();
    expect(within(journey()).getByText("ENTENDER")).toBeTruthy();
    expect(within(journey()).getByText("APLICAÇÕES")).toBeTruthy();
    expect(screen.getByLabelText("Valor de a")).toBeTruthy();
    expect(screen.getByLabelText("Valor de b")).toBeTruthy();
    expect(screen.queryByText(/ARRASTE/)).toBeNull();

    fireEvent.click(within(journey()).getByText("ENTENDER"));
    expect(screen.getByLabelText("Transformar a demonstração")).toBeTruthy();

    // volta para a entrada e entra na MARATONA
    fireEvent.click(firstButton(/CONCEITO/));
    fireEvent.click(await screen.findByRole("button", { name: /MARATONA/ }));

    const group = await screen.findByRole("group", { name: "Alternativas" });
    const alternatives = within(group).getAllByRole("button");
    expect(alternatives.length).toBeGreaterThanOrEqual(2);
    expect(alternatives.length).toBeLessThanOrEqual(5);

    // normal: alternativas visíveis, apoio sob demanda
    expect(screen.queryByText("DICA")).toBeNull();
    fireEvent.click(screen.getByText("APOIO"));
    expect(screen.getByText("DICA")).toBeTruthy();
    expect(screen.getByText("FÓRMULA")).toBeTruthy();

    // responde: confirmação discreta, sem tela de comemoração
    fireEvent.click(alternatives[0]);
    await waitFor(() => expect(screen.getByText(/CORRETO|REVEJA/)).toBeTruthy());

    const next = screen.getByText("PRÓXIMA").closest("button") as HTMLButtonElement;
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    await waitFor(() => expect(screen.queryByText(/CORRETO|REVEJA/)).toBeNull());
  }, 60000);

  it("usa a dificuldade como nível de apoio, não como banco de questões", async () => {
    await enterAtlas();
    await openGeometry();

    fireEvent.click(firstButton(/^Pitágoras/));
    await waitFor(() => expect(screen.getByText("DOMÍNIO")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /MARATONA/ }));
    await screen.findByRole("group", { name: "Alternativas" });

    // LEVE: fórmula, dica e alternativas sempre visíveis
    fireEvent.click(screen.getByRole("button", { name: "LEVE" }));
    await waitFor(() => expect(screen.getByText("FÓRMULA")).toBeTruthy());
    expect(screen.getByText("DICA")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Alternativas" })).toBeTruthy();

    // NORMAL: apoio escondido até o botão; alternativas visíveis
    fireEvent.click(screen.getByRole("button", { name: "NORMAL" }));
    await waitFor(() => expect(screen.queryByText("FÓRMULA")).toBeNull());
    expect(screen.queryByText("DICA")).toBeNull();
    expect(screen.getByText("APOIO")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Alternativas" })).toBeTruthy();

    // AVANÇADA: só o enunciado até o estudante pedir para responder
    fireEvent.click(screen.getByRole("button", { name: "AVANÇADA" }));
    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "Alternativas" })).toBeNull(),
    );
    expect(screen.queryByText("FÓRMULA")).toBeNull();
    fireEvent.click(screen.getByText("RESPONDER"));
    await waitFor(() => expect(screen.getByRole("group", { name: "Alternativas" })).toBeTruthy());
    expect(screen.queryByText("FÓRMULA")).toBeNull();
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
    await openGeometry();

    fireEvent.click(firstButton(/^Semelhança/));
    await waitFor(() =>
      expect(screen.getByText("ESTE TERRITÓRIO AINDA ESTÁ SENDO MAPEADO.")).toBeTruthy(),
    );
    fireEvent.click(screen.getByText("← VOLTAR AO ATLAS"));
    await waitFor(() => expect(screen.getAllByText("Ângulos").length).toBeGreaterThan(0));
  }, 60000);

  it("navega de volta pela hierarquia", async () => {
    await enterAtlas();
    await openGeometry();

    // voltar do território para a matéria
    fireEvent.click(firstButton(/Voltar para MATEMÁTICA/));
    await waitFor(() => expect(screen.getByText("CONHECIMENTO EM ÓRBITA")).toBeTruthy());

    // e da matéria para a home
    fireEvent.click(firstButton(/INÍCIO/));
    await waitFor(() => expect(screen.getByText("TOQUE OU APROXIME PARA EXPLORAR")).toBeTruthy());
  }, 60000);
});
