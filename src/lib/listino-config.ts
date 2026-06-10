export type ListinoPriceRow = {
  service: string;
  details: string;
  price: string;
};

export type ListinoPromotion = {
  name: string;
  condition: string;
  benefit: string;
};

export type ListinoConfig = {
  dailyRates: ListinoPriceRow[];
  overnightRates: ListinoPriceRow[];
  extraServices: ListinoPriceRow[];
  promotions: ListinoPromotion[];
  conditions: string[];
};

export const dailyRates: ListinoPriceRow[] = [
  {
    service: "Pensione giornaliera",
    details: "Ingresso mattina, uscita entro sera, area sgambamento inclusa",
    price: "EUR 22",
  },
  {
    service: "Mezza giornata",
    details: "Fino a 5 ore di permanenza, ideale per inserimenti graduali",
    price: "EUR 14",
  },
  {
    service: "Giornata con pasto",
    details: "Asilo giornaliero con somministrazione pappa fornita dal cliente",
    price: "EUR 25",
  },
];

export const overnightRates: ListinoPriceRow[] = [
  {
    service: "Pensione notturna cane piccolo",
    details: "Box dedicato, gestione quotidiana e area esterna",
    price: "EUR 28 / notte",
  },
  {
    service: "Pensione notturna cane medio",
    details: "Box dedicato, gestione quotidiana e area esterna",
    price: "EUR 32 / notte",
  },
  {
    service: "Pensione notturna cane grande",
    details: "Box dedicato, gestione quotidiana e area esterna",
    price: "EUR 36 / notte",
  },
  {
    service: "Cane gigante o gestione speciale",
    details: "Per soggetti molto grandi o con necessita di routine dedicate",
    price: "Da EUR 40 / notte",
  },
];

export const extraServices: ListinoPriceRow[] = [
  {
    service: "Alimentazione fornita dalla struttura",
    details: "Crocchette standard della pensione, salvo esigenze specifiche",
    price: "EUR 4 / giorno",
  },
  {
    service: "Somministrazione farmaci",
    details: "Secondo indicazioni scritte del proprietario",
    price: "EUR 3 / giorno",
  },
  {
    service: "Bagnetto prima del ritiro",
    details: "Servizio su prenotazione, disponibilita da confermare",
    price: "Da EUR 18",
  },
  {
    service: "Ritiro o consegna concordata",
    details: "Servizio locale su appuntamento e in base alla distanza",
    price: "Da EUR 10",
  },
];

export const promotions: ListinoPromotion[] = [
  {
    name: "Box condiviso famiglia",
    condition:
      "Due cani dello stesso proprietario, gia abituati a stare insieme e compatibili in box.",
    benefit: "-20% sul secondo cane",
  },
  {
    name: "Soggiorni lunghi",
    condition: "Permanenze continuative superiori a 14 notti.",
    benefit: "-10% sul totale pensione",
  },
  {
    name: "Inserimento cuccioli",
    condition:
      "Prima esperienza in struttura con mezza giornata conoscitiva prima del soggiorno.",
    benefit: "Prima mezza giornata EUR 10",
  },
];

export const conditions: string[] = [
  "Le tariffe sono indicative e possono variare in base a taglia, periodo, durata del soggiorno e necessita specifiche del cane.",
  "La condivisione del box e possibile solo per cani che si conoscono, compatibili tra loro e appartenenti allo stesso nucleo familiare. La struttura puo interrompere la condivisione se non la ritiene sicura.",
  "Per soggiorni notturni il giorno di uscita non viene conteggiato come notte, salvo permanenza prolungata oltre l'orario concordato.",
  "Il cibo portato dal proprietario deve essere porzionato o accompagnato da indicazioni chiare sulle quantita giornaliere.",
  "Farmaci, integratori e terapie vengono somministrati solo con istruzioni scritte e confezioni riconoscibili.",
  "Nei periodi di alta richiesta puo essere richiesta una caparra per confermare il posto.",
  "Vaccinazioni, trattamenti antiparassitari e condizioni sanitarie devono essere in regola prima dell'ingresso in struttura.",
];

export const listinoConfig: ListinoConfig = {
  dailyRates,
  overnightRates,
  extraServices,
  promotions,
  conditions,
};
