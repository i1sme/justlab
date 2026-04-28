// chemistry/ — обёртки над RDKit-JS и OpenChemLib-JS, парсеры формул, БД реакций.
// IMPORTANT: парсинг и расчёты должны выполняться в Web Worker (см. lib/workers/).
// RDKit (~10 MB WASM) грузится только через динамический import().

export * from './cpk-colors';
export * from './reaction-engine';
