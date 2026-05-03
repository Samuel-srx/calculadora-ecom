"use client";

import { useMemo, useState } from "react";
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

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor: number) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
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
          <span className="min-w-[14px] text-center text-gray-500">
            {icone}
          </span>
        )}
        <span>{label}</span>
      </span>

      <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm transition duration-300 hover:border-orange-200 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-100">
        {prefixo && (
          <span className="mr-2 text-sm font-bold text-gray-400">
            {prefixo}
          </span>
        )}

        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent py-3 text-base font-semibold text-gray-900 outline-none"
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
      className={`rounded-2xl border p-5 text-center transition duration-300 hover:-translate-y-1 hover:shadow-md ${
        ativo
          ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
          : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/40"
      }`}
    >
      <div className="text-2xl font-bold text-gray-600">{icone}</div>
      <p
        className={`mt-2 font-bold ${
          ativo ? "text-orange-700" : "text-gray-800"
        }`}
      >
        {titulo}
      </p>
      <p className="text-sm text-gray-500">{subtitulo}</p>
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
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        destaque ? cores[destaque] : "border-gray-100 bg-gray-50 text-gray-900"
      }`}
    >
      <span className="text-sm font-medium">{nome}</span>
      <strong>{moeda(valor)}</strong>
    </div>
  );
}

export default function CalculadoraShopee() {
  const [tipoVendedor, setTipoVendedor] = useState<TipoVendedor>("CNPJ");
  const [metodo, setMetodo] = useState<MetodoCalculo>("margem");
  const [copiado, setCopiado] = useState(false);
const [kitAtivo, setKitAtivo] = useState(false);
const [taxasAbertas, setTaxasAbertas] = useState(false);

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
    });
  }, [form, metodo, tipoVendedor, kitAtivo]);

  function alterar(campo: keyof FormState, valor: number) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  const dadosGrafico = [
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
      nome: "Anúncios",
      valor: resultado.ads,
      cor: "#3b82f6",
    },
    {
      nome: "Lucro",
      valor: Math.max(resultado.lucro, 0),
      cor: "#16a34a",
    },
  ];

  const totalGrafico = dadosGrafico.reduce((acc, item) => acc + item.valor, 0);

  let inicio = 0;
  const conic = dadosGrafico
    .map((item) => {
      const fatia = totalGrafico > 0 ? (item.valor / totalGrafico) * 100 : 0;
      const parte = `${item.cor} ${inicio}% ${inicio + fatia}%`;
      inicio += fatia;
      return parte;
    })
    .join(", ");

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
    <div className="animacao-entrada mx-auto max-w-6xl text-gray-900">
      <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="border-b border-orange-100 bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-100">
                HE Calculator
              </p>
              <h1 className="mt-2 text-3xl font-black">Calculadora Shopee</h1>
              <p className="mt-1 max-w-2xl text-sm text-orange-50">
                Calcule preço ideal, lucro líquido, taxas, impostos, anúncios e
                projeção mensal para vender com segurança.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold backdrop-blur">
              Taxas 2026
            </div>
          </div>
        </div>

        <div className="grid gap-3 bg-white p-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-xs font-bold uppercase text-orange-600">
              Marketplace
            </p>
            <p className="mt-1 text-lg font-black">Shopee</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
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

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase text-gray-500">
              Vendedor
            </p>
            <p className="mt-1 text-lg font-black">{tipoVendedor}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
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
                className={`rounded-2xl px-4 py-3 font-black transition duration-300 hover:-translate-y-0.5 ${
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
                className={`rounded-2xl px-4 py-3 font-black transition duration-300 hover:-translate-y-0.5 ${
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
            <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <strong>Regra CPF:</strong> após ultrapassar 450 itens vendidos
              em 90 dias, aplicamos R$ 3,00 por item. Na calculadora usamos
              150 vendas/mês como referência.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Custo do produto unitário"
              prefixo="R$"
              value={form.custoProduto}
              onChange={(v) => alterar("custoProduto", v)}
              icone="▣"
            />

            <Campo
              label="Custo da embalagem"
              prefixo="R$"
              value={form.custoEmbalagem}
              onChange={(v) => alterar("custoEmbalagem", v)}
              icone="□"
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
                icone="↗"
              />
            )}

            {metodo === "preco" && (
              <Campo
                label="Preço de venda desejado"
                prefixo="R$"
                value={form.precoVenda}
                onChange={(v) => alterar("precoVenda", v)}
                icone="$"
              />
            )}

            {metodo === "lucro" && (
              <Campo
                label="Lucro líquido desejado"
                prefixo="R$"
                value={form.lucroDesejado}
                onChange={(v) => alterar("lucroDesejado", v)}
                icone="◎"
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
              icone="%"
            />

            <Campo
              label="ROAS desejado"
              value={form.roas}
              onChange={(v) => alterar("roas", v)}
              ajuda={`Com essa margem, tente buscar ROAS maior que ${Math.ceil(
                Math.max(form.roas, 1)
              )}.`}
              icone="↗"
            />

            <Campo
              label="Preço médio do mercado"
              prefixo="R$"
              value={form.precoMercado}
              onChange={(v) => alterar("precoMercado", v)}
              icone="◎"
            />

            <Campo
              label="Vendas estimadas por mês"
              value={form.vendasMes}
              onChange={(v) => alterar("vendasMes", v)}
              icone="⇅"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 text-white">
              <h2 className="text-xl font-black">Resultado do cálculo</h2>
            </div>

            <div className="p-6">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6 text-center">
                <p className="text-sm font-bold uppercase text-gray-500">
                  Preço para cadastrar na Shopee
                </p>

                <p className="mt-2 text-5xl font-black tracking-tight text-gray-950">
                  {moeda(resultado.preco)}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-black ${
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
        <span className="text-gray-600">Comissão Shopee (14%)</span>
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
                  nome={`Anúncios (ROAS ${form.roas})`}
                  valor={resultado.ads}
                  destaque="azul"
                />

                {resultado.taxaExtraCPF > 0 && (
                  <LinhaCusto
                    nome="Taxa extra CPF"
                    valor={resultado.taxaExtraCPF}
                    destaque="vermelho"
                  />
                )}

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

          <div className="rounded-3xl bg-white p-6 shadow-sm">
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
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Seu preço final</p>
                <p className="text-2xl font-black">{moeda(resultado.preco)}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Preço mercado</p>
                <p className="text-2xl font-black">
                  {moeda(form.precoMercado)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-100 p-4">
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
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Projeção mensal</h2>

          <div className="mt-4 text-center">
            <span className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-black text-white">
              {form.vendasMes} vendas/mês
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

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Distribuição de custos</h2>

          <div className="mt-6 flex flex-col items-center gap-5">
            <div
              className="h-56 w-56 rounded-full"
              style={{
                background: `conic-gradient(${conic})`,
              }}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full p-8">
                <div className="h-28 w-28 rounded-full bg-white shadow-inner" />
              </div>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2">
              {dadosGrafico.map((item) => (
                <div key={item.nome} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.cor }}
                  />
                  <span className="font-semibold text-gray-700">
                    {item.nome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 text-white">
          <h2 className="text-xl font-black">Compartilhar resultado</h2>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-600">
            Copie o cálculo formatado para enviar no WhatsApp ou salvar.
          </p>

          <button
            type="button"
            onClick={copiarResumo}
            className="mt-5 rounded-2xl bg-orange-500 px-6 py-3 font-black text-white shadow-md shadow-orange-100 transition hover:bg-orange-600"
          >
            {copiado ? "Resumo copiado!" : "Copiar resumo completo"}
          </button>
        </div>
      </section>
    </div>
  );
}