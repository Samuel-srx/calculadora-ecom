export type TipoVendedor = "CPF" | "CNPJ";
export type MetodoCalculo = "margem" | "preco" | "lucro";

export type CalculoShopeeParams = {
  metodo: MetodoCalculo;
  tipoVendedor: TipoVendedor;

  custoProduto: number;
  custoEmbalagem: number;

  margemDesejada: number;
  precoVenda: number;
  lucroDesejado: number;

  imposto: number;
  roas: number;
  precoMercado: number;
  vendasMes: number;

  kitAtivo: boolean;
  quantidadeKit: number;

  cpfMaisDe450Pedidos: boolean;
};

function valorSeguro(valor: number, fallback = 0) {
  return Number.isFinite(valor) ? valor : fallback;
}

export function calcularShopee(p: CalculoShopeeParams) {
  const custoProdutoUnitario = valorSeguro(p.custoProduto);
  const custoEmbalagem = valorSeguro(p.custoEmbalagem);

  const quantidadeKit =
    p.kitAtivo && valorSeguro(p.quantidadeKit) > 1
      ? Math.floor(valorSeguro(p.quantidadeKit))
      : 1;

  const custoProdutoTotal = custoProdutoUnitario * quantidadeKit;
  const custoBase = custoProdutoTotal + custoEmbalagem;

  const margemDesejada = valorSeguro(p.margemDesejada) / 100;
  const impostoPercentual = valorSeguro(p.imposto) / 100;
  const roasSeguro = valorSeguro(p.roas) > 0 ? valorSeguro(p.roas) : 1;

  const comissaoPercentual = 0.14;
  const taxaFixaShopee = 26;

  const taxaExtraCPF =
    p.tipoVendedor === "CPF" && p.cpfMaisDe450Pedidos ? 3 : 0;

  const custoFixoTotal = custoBase + taxaFixaShopee + taxaExtraCPF;

  const percentualVariavel =
    comissaoPercentual + impostoPercentual + 1 / roasSeguro;

  let preco = 0;

  if (p.metodo === "margem") {
    preco = custoFixoTotal / (1 - percentualVariavel - margemDesejada);
  }

  if (p.metodo === "preco") {
    preco = valorSeguro(p.precoVenda);
  }

  if (p.metodo === "lucro") {
    preco =
      (custoFixoTotal + valorSeguro(p.lucroDesejado)) /
      (1 - percentualVariavel);
  }

  if (!Number.isFinite(preco) || preco < 0) {
    preco = 0;
  }

  const comissaoValor = preco * comissaoPercentual;
  const impostoValor = preco * impostoPercentual;
  const ads = preco / roasSeguro;

  const taxasShopee = comissaoValor + taxaFixaShopee + taxaExtraCPF;
  const totalCustos = custoBase + taxasShopee + impostoValor + ads;
  const lucro = preco - totalCustos;

  const margemReal = preco > 0 ? (lucro / preco) * 100 : 0;

  const vendasMes = valorSeguro(p.vendasMes);
  const receitaBrutaMensal = preco * vendasMes;
  const custosMensais = totalCustos * vendasMes;
  const lucroMensal = lucro * vendasMes;

  const precoMercado = valorSeguro(p.precoMercado);
  const diferencaMercado = precoMercado > 0 ? preco - precoMercado : 0;
  const percentualAcimaMercado =
    precoMercado > 0 ? (diferencaMercado / precoMercado) * 100 : 0;

  let statusCompetitividade: "competitivo" | "atenção" | "arriscado" =
    "competitivo";

  if (percentualAcimaMercado > 10) {
    statusCompetitividade = "atenção";
  }

  if (percentualAcimaMercado > 21) {
    statusCompetitividade = "arriscado";
  }

  const lucroIgualMercado =
    precoMercado > 0
      ? precoMercado -
        (custoBase +
          precoMercado * comissaoPercentual +
          taxaFixaShopee +
          taxaExtraCPF +
          precoMercado * impostoPercentual +
          precoMercado / roasSeguro)
      : 0;

  return {
    preco,
    lucro,
    margemReal,
    custoProdutoUnitario,
    custoProdutoTotal,
    quantidadeKit,
    custoEmbalagem,
    custoBase,
    totalCustos,
    impostoValor,
    ads,
    taxasShopee,
    comissaoValor,
    taxaFixaShopee,
    taxaExtraCPF,
    receitaBrutaMensal,
    custosMensais,
    lucroMensal,
    diferencaMercado,
    percentualAcimaMercado,
    statusCompetitividade,
    lucroIgualMercado,
  };
}