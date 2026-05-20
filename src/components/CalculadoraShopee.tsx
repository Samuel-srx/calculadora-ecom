"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calcularShopee,
  MetodoCalculo,
  TipoVendedor,
} from "../lib/calculosShopee";

type FormState = {
  custoProduto: number;
  custoEmbalagem: number;
  margemDesejada: number;
  precoVenda: number;
  lucroDesejado: number;
  imposto: number;
  roas: number;
  precoMercado: number;
  vendasMes: number;
  quantidadeKit: number;
};

type ItemGrafico = {
  nome: string;
  valor: number;
  cor: string;
  percentual: number;
};

function moeda(valor: number) {
  const valorSeguro = Number.isFinite(valor) ? valor : 0;

  return valorSeguro.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor: number) {
  const valorSeguro = Number.isFinite(valor) ? valor : 0;

  return valorSeguro.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function polarParaCartesiano(
  centroX: number,
  centroY: number,
  raio: number,
  anguloGraus: number
) {
  const anguloRadianos = ((anguloGraus - 90) * Math.PI) / 180;

  return {
    x: centroX + raio * Math.cos(anguloRadianos),
    y: centroY + raio * Math.sin(anguloRadianos),
  };
}

function criarFatiaDonut(
  centroX: number,
  centroY: number,
  raioExterno: number,
  raioInterno: number,
  anguloInicial: number,
  anguloFinal: number
) {
  const inicioExterno = polarParaCartesiano(
    centroX,
    centroY,
    raioExterno,
    anguloFinal
  );
  const fimExterno = polarParaCartesiano(
    centroX,
    centroY,
    raioExterno,
    anguloInicial
  );

  const inicioInterno = polarParaCartesiano(
    centroX,
    centroY,
    raioInterno,
    anguloFinal
  );
  const fimInterno = polarParaCartesiano(
    centroX,
    centroY,
    raioInterno,
    anguloInicial
  );

  const arcoGrande = anguloFinal - anguloInicial <= 180 ? "0" : "1";

  return [
    `M ${inicioExterno.x} ${inicioExterno.y}`,
    `A ${raioExterno} ${raioExterno} 0 ${arcoGrande} 0 ${fimExterno.x} ${fimExterno.y}`,
    `L ${fimInterno.x} ${fimInterno.y}`,
    `A ${raioInterno} ${raioInterno} 0 ${arcoGrande} 1 ${inicioInterno.x} ${inicioInterno.y}`,
    "Z",
  ].join(" ");
}

function Campo({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
  ajuda,
  icone,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefixo?: string;
  sufixo?: string;
  ajuda?: string;
  icone?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icone && (
  <span
    className="flex h-4 w-4 shrink-0 items-center justify-center text-gray-500"
    dangerouslySetInnerHTML={{ __html: icone }}
  />
)}
        <span>{label}</span>
      </span>

      <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 shadow-sm transition duration-200 hover:border-orange-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
        {prefixo && (
          <span className="mr-2 text-sm font-bold text-gray-400">
            {prefixo}
          </span>
        )}

        <input
          type="number"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => {
            const valorDigitado = e.target.value;

            if (valorDigitado === "") {
              onChange(Number.NaN);
              return;
            }

            onChange(Number(valorDigitado));
          }}
          className="w-full bg-transparent py-2.5 text-sm font-semibold text-gray-900 outline-none"
        />

        {sufixo && (
          <span className="ml-2 text-sm font-bold text-gray-400">
            {sufixo}
          </span>
        )}
      </div>

      {ajuda && <p className="mt-1 text-xs text-gray-500">{ajuda}</p>}
    </label>
  );
}

function CardMetodo({
  ativo,
  titulo,
  subtitulo,
  icone,
  onClick,
}: {
  ativo: boolean;
  titulo: string;
  subtitulo: string;
  icone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
        ativo
          ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
          : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
      }`}
    >
      <div className="text-lg font-bold text-gray-600">{icone}</div>

      <p
        className={`mt-1.5 text-sm font-bold ${
          ativo ? "text-orange-700" : "text-gray-800"
        }`}
      >
        {titulo}
      </p>

      <p className="text-xs text-gray-500">{subtitulo}</p>
    </button>
  );
}

function LinhaCusto({
  nome,
  valor,
  destaque,
}: {
  nome: string;
  valor: number;
  destaque?: "verde" | "azul" | "vermelho";
}) {
  const cores = {
    verde: "bg-green-50 text-green-800 border-green-100",
    azul: "bg-blue-50 text-blue-800 border-blue-100",
    vermelho: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
        destaque ? cores[destaque] : "border-gray-100 bg-gray-50 text-gray-900"
      }`}
    >
      <span className="text-sm font-medium">{nome}</span>
      <strong>{moeda(valor)}</strong>
    </div>
  );
}

function GraficoDistribuicao({ dados }: { dados: ItemGrafico[] }) {
  const [nomeAtivo, setNomeAtivo] = useState<string | null>(null);

  const dadosValidos = dados.filter((item) => item.valor > 0);
  const itemAtivo =
    dadosValidos.find((item) => item.nome === nomeAtivo) ?? null;

  const centro = 120;
  const raioExterno = 86;
  const raioInterno = 50;

  let anguloAtual = 0;

  return (
    <div className="mt-6 space-y-4" onMouseLeave={() => setNomeAtivo(null)}>
      <div className="flex justify-center">
        <svg
          width="220"
          height="220"
          viewBox="0 0 240 240"
          className="drop-shadow-sm"
        >
          <circle cx={centro} cy={centro} r={raioExterno} fill="#f3f4f6" />

          {dadosValidos.map((item) => {
            const anguloFatia = (item.percentual / 100) * 360;
            const anguloInicial = anguloAtual;
            const anguloFinal = anguloAtual + anguloFatia;
            anguloAtual = anguloFinal;

            const caminho = criarFatiaDonut(
              centro,
              centro,
              raioExterno,
              raioInterno,
              anguloInicial,
              anguloFinal
            );

            const estaAtivo = itemAtivo?.nome === item.nome;

            return (
              <path
                key={item.nome}
                d={caminho}
                fill={item.cor}
                stroke="#ffffff"
                strokeWidth="4"
                className="cursor-pointer transition duration-300"
                style={{
                  opacity: itemAtivo && !estaAtivo ? 0.35 : 1,
                  filter: estaAtivo
                    ? "drop-shadow(0 8px 10px rgba(15, 23, 42, 0.16))"
                    : "none",
                  transform: estaAtivo ? "scale(1.025)" : "scale(1)",
                  transformOrigin: "center",
                }}
                onMouseEnter={() => setNomeAtivo(item.nome)}
                onClick={() => setNomeAtivo(item.nome)}
              />
            );
          })}

          <circle cx={centro} cy={centro} r={raioInterno - 2} fill="white" />
        </svg>
      </div>

      <div className="h-[138px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {itemAtivo ? (
          <>
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: itemAtivo.cor }}
              />

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Detalhamento da fatia
                </p>
                <h3 className="truncate text-base font-black text-gray-900">
                  {itemAtivo.nome}
                </h3>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-bold uppercase text-gray-400">
                  Valor
                </p>
                <p className="mt-1 text-sm font-black text-gray-900">
                  {moeda(itemAtivo.valor)}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-bold uppercase text-gray-400">
                  Participação
                </p>
                <p
                  className="mt-1 text-sm font-black"
                  style={{ color: itemAtivo.cor }}
                >
                  {numero(itemAtivo.percentual)}%
                </p>
              </div>
            </div>

            <p className="mt-2 truncate rounded-xl bg-orange-50 px-3 py-2 text-xs text-gray-700">
              Representa <strong>{numero(itemAtivo.percentual)}%</strong> do
              total.
            </p>
          </>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
            <p className="text-sm font-semibold text-gray-500">
              Passe o mouse sobre o gráfico ou uma categoria para ver os
              detalhes.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {dadosValidos.map((item) => {
          const estaAtivo = itemAtivo?.nome === item.nome;

          return (
            <button
              key={item.nome}
              type="button"
              onMouseEnter={() => setNomeAtivo(item.nome)}
              onFocus={() => setNomeAtivo(item.nome)}
              onClick={() => setNomeAtivo(item.nome)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                estaAtivo
                  ? "border-orange-200 bg-orange-50 shadow-sm"
                  : "border-gray-100 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.cor }}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-800">
                    {item.nome}
                  </p>
                  <p className="text-xs font-semibold text-gray-500">
                    {moeda(item.valor)}
                  </p>
                </div>
              </div>

              <span
                className="shrink-0 rounded-full px-2 py-1 text-xs font-black"
                style={{
                  color: item.cor,
                  backgroundColor: `${item.cor}18`,
                }}
              >
                {numero(item.percentual)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CalculadoraShopee() {
  const [tipoVendedor, setTipoVendedor] = useState<TipoVendedor>("CNPJ");
  const [metodo, setMetodo] = useState<MetodoCalculo>("margem");
  const [copiado, setCopiado] = useState(false);
  const [kitAtivo, setKitAtivo] = useState(false);
  const [taxasAbertas, setTaxasAbertas] = useState(false);
  const [cpfMaisDe450Pedidos, setCpfMaisDe450Pedidos] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  const primeiraRenderizacao = useRef(true);

  const [form, setForm] = useState<FormState>({
    custoProduto: 59.9,
    custoEmbalagem: 1.3,
    margemDesejada: 25,
    precoVenda: 170.2,
    lucroDesejado: 40,
    imposto: 15,
    roas: 13,
    precoMercado: 58,
    vendasMes: 64,
    quantidadeKit: 2,
  });

  const resultado = useMemo(() => {
    return calcularShopee({
      ...form,
      metodo,
      tipoVendedor,
      kitAtivo,
      cpfMaisDe450Pedidos,
    });
  }, [form, metodo, tipoVendedor, kitAtivo, cpfMaisDe450Pedidos]);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    setRecalculando(true);

    const timer = setTimeout(() => {
      setRecalculando(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [form, metodo, tipoVendedor, kitAtivo, cpfMaisDe450Pedidos]);

  function alterar(campo: keyof FormState, valor: number) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  const dadosGraficoBase = [
    {
      nome: "Produto",
      valor: resultado.custoProdutoTotal,
      cor: "#334155",
    },
    {
      nome: "Embalagem",
      valor: resultado.custoEmbalagem,
      cor: "#94a3b8",
    },
    {
      nome: "Taxas Shopee",
      valor: resultado.taxasShopee,
      cor: "#fb923c",
    },
    {
      nome: "Impostos",
      valor: resultado.impostoValor,
      cor: "#ef4444",
    },
    {
      nome: `Anúncios (ROAS ${Number.isNaN(form.roas) ? 0 : form.roas})`,
      valor: resultado.ads,
      cor: "#3b82f6",
    },
    {
      nome: "Lucro Líquido",
      valor: Math.max(resultado.lucro, 0),
      cor: "#16a34a",
    },
  ];

  const totalGrafico = dadosGraficoBase.reduce(
    (acc, item) => acc + Math.max(item.valor, 0),
    0
  );

  const dadosGrafico = dadosGraficoBase.map((item) => ({
    ...item,
    valor: Math.max(item.valor, 0),
    percentual:
      totalGrafico > 0 ? (Math.max(item.valor, 0) / totalGrafico) * 100 : 0,
  }));

  function copiarResumo() {
    const resumo = `
HE Calculator - Shopee

Tipo de vendedor: ${tipoVendedor}
Método de cálculo: ${
      metodo === "margem"
        ? "Margem de lucro"
        : metodo === "preco"
        ? "Preço de venda"
        : "Lucro desejado"
    }

CPF vendeu mais de 450 pedidos nos últimos 90 dias: ${
      cpfMaisDe450Pedidos ? "Sim" : "Não"
    }

Kit ativo: ${kitAtivo ? "Sim" : "Não"}
Quantidade no kit: ${kitAtivo ? form.quantidadeKit : 1}

Preço sugerido: ${moeda(resultado.preco)}
Lucro líquido: ${moeda(resultado.lucro)}
Margem real: ${numero(resultado.margemReal)}%

Custos:
Produto unitário: ${moeda(resultado.custoProdutoUnitario)}
Produto total: ${moeda(resultado.custoProdutoTotal)}
Embalagem: ${moeda(resultado.custoEmbalagem)}
Taxas Shopee: ${moeda(resultado.taxasShopee)}
Impostos: ${moeda(resultado.impostoValor)}
Anúncios: ${moeda(resultado.ads)}
Total de custos: ${moeda(resultado.totalCustos)}

Projeção mensal:
Vendas/mês: ${form.vendasMes}
Receita bruta: ${moeda(resultado.receitaBrutaMensal)}
Custos totais: ${moeda(resultado.custosMensais)}
Lucro líquido mensal: ${moeda(resultado.lucroMensal)}
`.trim();

    navigator.clipboard.writeText(resumo);
    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  }

  const statusClasses = {
    competitivo: "bg-green-100 text-green-700",
    atenção: "bg-yellow-100 text-yellow-700",
    arriscado: "bg-red-100 text-red-700",
  };

  return (
    <div className="animacao-entrada mx-auto max-w-5xl text-gray-900">
      <header className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm">
  <div className="border-b border-orange-100 bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-5 text-white">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex items-start gap-4">
  <div className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32">
    {/* degradê atrás da logo */}
    <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-orange-500/55 via-orange-300/20 to-white/0 blur-3xl" />

    {/* logo */}
    <img
      src="/logo-he.png"
      alt="Logo HE Calculator"
      className="h-full w-full object-contain opacity-90 drop-shadow-md"
    />
  </div>

  <div className="pt-2">
    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-100">
      HE CALCULATOR
    </p>

    <h1 className="mt-2 text-3xl font-black text-white">
      Calculadora Shopee
    </h1>

    <p className="mt-1 max-w-2xl text-sm text-orange-50">
      Calcule preço ideal, lucro líquido, taxas, impostos, anúncios e
      projeção mensal para vender com segurança.
    </p>
  </div>
</div>

      <div className="w-fit rounded-xl bg-white/15 px-3 py-2 text-xs font-bold backdrop-blur">
        Taxas 2026
      </div>
    </div>
  </div>

  <div className="grid gap-2 bg-white p-3 sm:grid-cols-3">
    <div className="rounded-xl bg-orange-50 p-3">
      <p className="text-xs font-bold uppercase text-orange-600">
        Marketplace
      </p>
      <p className="mt-1 text-lg font-black">Shopee</p>
    </div>

    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase text-gray-500">
        Modo ativo
      </p>
      <p className="mt-1 text-lg font-black">
        {metodo === "margem"
          ? "Margem"
          : metodo === "preco"
          ? "Preço"
          : "Lucro"}
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase text-gray-500">
        Vendedor
      </p>
      <p className="mt-1 text-lg font-black">{tipoVendedor}</p>
    </div>
  </div>
</header>

      <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Dados do produto</h2>
              <p className="text-sm text-gray-500">Campos obrigatórios</p>
            </div>

            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              Shopee
            </span>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-bold text-gray-700">
              Tipo de vendedor
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoVendedor("CNPJ")}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition duration-200 hover:-translate-y-0.5 ${
                  tipoVendedor === "CNPJ"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-50"
                }`}
              >
                CNPJ
              </button>

              <button
                type="button"
                onClick={() => setTipoVendedor("CPF")}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition duration-200 hover:-translate-y-0.5 ${
                  tipoVendedor === "CPF"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-50"
                }`}
              >
                CPF
              </button>
            </div>
          </div>

          {tipoVendedor === "CPF" && (
            <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={cpfMaisDe450Pedidos}
                  onChange={(e) => setCpfMaisDe450Pedidos(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                />

                <span className="flex-1 text-sm font-semibold text-gray-800">
                  Vendeu mais de 450 pedidos nos últimos 90 dias?
                  <span className="ml-1 font-bold text-orange-700">
                    (+R$ 3,00 por item)
                  </span>
                </span>

                <span
                  title="Para vendedores CPF que emitiram mais de 450 pedidos em 90 dias, a Shopee pode aplicar taxa adicional de R$ 3,00 por item vendido."
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-black text-gray-500"
                >
                  i
                </span>
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
  <Campo
    label="Custo do produto unitário"
    prefixo="R$"
    value={form.custoProduto}
    onChange={(v) => alterar("custoProduto", v)}
    icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>`}
  />

  <Campo
    label="Custo da embalagem"
    prefixo="R$"
    value={form.custoEmbalagem}
    onChange={(v) => alterar("custoEmbalagem", v)}
    icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l2 7H4l2-7Z"/><path d="M4 9h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"/><path d="M9 13h6"/></svg>`}
  />
</div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={kitAtivo}
                onChange={(e) => setKitAtivo(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-orange-500"
              />

              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="text-gray-500">▣</span>
                Este anúncio é um kit com múltiplos produtos?
              </span>
            </label>

            {kitAtivo && (
              <div className="mt-4">
                <Campo
                  label="Quantidade de produtos no kit"
                  value={form.quantidadeKit}
                  onChange={(v) => alterar("quantidadeKit", v)}
                  ajuda="O custo do produto será multiplicado automaticamente por essa quantidade."
                  icone="#"
                />
              </div>
            )}
          </div>

          <div className="my-6 h-px bg-gray-100" />

          <p className="mb-3 text-sm font-bold text-gray-700">
            Como você quer calcular o preço?
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <CardMetodo
              ativo={metodo === "margem"}
              titulo="Margem de Lucro"
              subtitulo="Define o lucro (%)"
              icone="↗"
              onClick={() => setMetodo("margem")}
            />

            <CardMetodo
              ativo={metodo === "preco"}
              titulo="Preço de Venda"
              subtitulo="Define o preço (R$)"
              icone="$"
              onClick={() => setMetodo("preco")}
            />

            <CardMetodo
              ativo={metodo === "lucro"}
              titulo="Lucro Desejado"
              subtitulo="Define o lucro (R$)"
              icone="◎"
              onClick={() => setMetodo("lucro")}
            />
          </div>

          <div className="mt-6">
            {metodo === "margem" && (
              <Campo
                label="Margem de lucro desejada"
                sufixo="%"
                value={form.margemDesejada}
                onChange={(v) => alterar("margemDesejada", v)}
                icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18h16"/><path d="M6 16l5-5 3 3 5-7"/><path d="M15 7h4v4"/></svg>`}
              />
            )}

            {metodo === "preco" && (
              <Campo
                label="Preço de venda desejado"
                prefixo="R$"
                value={form.precoVenda}
                onChange={(v) => alterar("precoVenda", v)}
                icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>`}
              />
            )}

            {metodo === "lucro" && (
              <Campo
                label="Lucro líquido desejado"
                prefixo="R$"
                value={form.lucroDesejado}
                onChange={(v) => alterar("lucroDesejado", v)}
                icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M8 11l4-4 4 4"/><path d="M8 15h8"/></svg>`}
              />
            )}
          </div>

          <div className="my-6 h-px bg-gray-100" />

          <h3 className="mb-4 text-lg font-black">Outras configurações</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Imposto"
              sufixo="%"
              value={form.imposto}
              onChange={(v) => alterar("imposto", v)}
              icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`}
            />

            <Campo
              label="ROAS desejado"
              value={form.roas}
              onChange={(v) => alterar("roas", v)}
              ajuda={`Com essa margem, tente buscar ROAS maior que ${Math.ceil(
                Math.max(Number.isNaN(form.roas) ? 0 : form.roas, 1)
              )}.`}
              icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/></svg>`}
            />

            <Campo
              label="Preço médio do mercado"
              prefixo="R$"
              value={form.precoMercado}
              onChange={(v) => alterar("precoMercado", v)}
              icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>`}
            />

            <Campo
              label="Vendas estimadas por mês"
              value={form.vendasMes}
              onChange={(v) => alterar("vendasMes", v)}
              icone={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5"/><rect x="12" y="8" width="3" height="8"/><rect x="17" y="4" width="3" height="12"/></svg>`}
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-4 text-white">
              <h2 className="text-xl font-black">Resultado do cálculo</h2>
            </div>

            <div className="p-5">
              <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
                {recalculando && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-100">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Recalculando...
                    </div>
                  </div>
                )}

                <p className="text-sm font-bold uppercase text-gray-500">
                  Preço para cadastrar na Shopee
                </p>

                <p className="mt-2 text-4xl font-black tracking-tight text-gray-950">
                  {moeda(resultado.preco)}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                    resultado.lucro >= 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Lucro real: {moeda(resultado.lucro)} (
                  {numero(resultado.margemReal)}%)
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <LinhaCusto
                  nome={
                    kitAtivo
                      ? `Custo do produto (${form.quantidadeKit} un.)`
                      : "Custo do produto"
                  }
                  valor={resultado.custoProdutoTotal}
                />

                <LinhaCusto
                  nome="Custo da embalagem"
                  valor={resultado.custoEmbalagem}
                />

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setTaxasAbertas((atual) => !atual)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      Taxas da Shopee
                    </span>

                    <span className="flex items-center gap-3">
                      <strong>{moeda(resultado.taxasShopee)}</strong>
                      <span
                        className={`text-gray-500 transition-transform duration-300 ${
                          taxasAbertas ? "rotate-180" : ""
                        }`}
                      >
                        ˅
                      </span>
                    </span>
                  </button>

                  {taxasAbertas && (
                    <div className="space-y-2 border-t border-gray-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                        <span className="text-gray-600">
                          Comissão Shopee (20%)
                        </span>
                        <strong className="text-gray-900">
                          {moeda(resultado.comissaoValor)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                        <span className="text-gray-600">Taxa fixa Shopee</span>
                        <strong className="text-gray-900">
                          {moeda(resultado.taxaFixaShopee)}
                        </strong>
                      </div>

                      {resultado.taxaExtraCPF > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-sm">
                          <span className="text-red-700">Taxa extra CPF</span>
                          <strong className="text-red-700">
                            {moeda(resultado.taxaExtraCPF)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <LinhaCusto
                  nome="Impostos"
                  valor={resultado.impostoValor}
                  destaque="vermelho"
                />

                <LinhaCusto
                  nome={`Anúncios (ROAS ${
                    Number.isNaN(form.roas) ? 0 : form.roas
                  })`}
                  valor={resultado.ads}
                  destaque="azul"
                />

                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="font-black">Total de custos + taxas</span>
                  <strong>{moeda(resultado.totalCustos)}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">Lucro líquido</span>
                  <strong
                    className={`text-2xl ${
                      resultado.lucro >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {moeda(resultado.lucro)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">
                  Análise de competitividade
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Comparação com o preço médio do mercado
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-black capitalize ${
                  statusClasses[resultado.statusCompetitividade]
                }`}
              >
                {resultado.statusCompetitividade}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Seu preço final</p>
                <p className="text-2xl font-black">{moeda(resultado.preco)}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Preço mercado</p>
                <p className="text-2xl font-black">
                  {moeda(form.precoMercado)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-100 p-4">
              {resultado.diferencaMercado > 0 ? (
                <p className="text-sm text-red-600">
                  Seu preço está {numero(resultado.percentualAcimaMercado)}%
                  acima do mercado.
                </p>
              ) : (
                <p className="text-sm text-green-600">
                  Seu preço está competitivo em relação ao mercado.
                </p>
              )}

              <p className="mt-3 text-sm font-semibold text-gray-700">
                Se vender no preço médio do mercado, seu lucro seria:
              </p>

              <p
                className={`mt-1 text-2xl font-black ${
                  resultado.lucroIgualMercado >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {moeda(resultado.lucroIgualMercado)}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Projeção mensal</h2>

          <div className="mt-4 text-center">
            <span className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-black text-white">
              {Number.isNaN(form.vendasMes) ? 0 : form.vendasMes} vendas/mês
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <LinhaCusto
              nome="Receita bruta"
              valor={resultado.receitaBrutaMensal}
              destaque="azul"
            />

            <LinhaCusto
              nome="Custos totais"
              valor={resultado.custosMensais}
              destaque="vermelho"
            />

            <LinhaCusto
              nome="Lucro líquido mensal"
              valor={resultado.lucroMensal}
              destaque="verde"
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Distribuição de custos</h2>
          <GraficoDistribuicao dados={dadosGrafico} />
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-4 text-white">
          <h2 className="text-xl font-black">Compartilhar resultado</h2>
        </div>

        <div className="p-5 text-center">
          <p className="text-gray-600">
            Copie o cálculo formatado para enviar no WhatsApp ou salvar.
          </p>

          <button
            type="button"
            onClick={copiarResumo}
            className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600"
          >
            {copiado ? "Resumo copiado!" : "Copiar resumo completo"}
          </button>

          <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-xs font-medium text-red-700">
  <div className="flex items-start gap-2">
    <span className="mt-0.5 text-sm">⚠️</span>

    <p>
      Os resultados são estimativas com base nas taxas informadas. Confira
      sempre as regras atuais da plataforma antes de cadastrar o produto.
    </p>
  </div>
</div>

        </div>
      </section>
    </div>
  );
}