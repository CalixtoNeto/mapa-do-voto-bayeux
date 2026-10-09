// O que é compra ou contratação (material, serviço, obra, locação) e pode passar por licitação.
// Salário, previdência e repasses nunca passam, então ficam fora das contas de licitação e dos alertas.
const COMPRA = /material|servi[cç]o|loca[cç]|obras|equipamento|consultoria|passage/i;

export const ehCompra = elemento => COMPRA.test(elemento);
