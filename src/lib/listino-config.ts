export type ListinoPriceRow = {
  id?: string;
  service: string;
  details: string;
  price: string;
  amountCents?: number;
  billingUnit?: "per_day" | "per_night" | "per_day_per_dog" | "per_dog_once" | "per_booking";
  dogSize?: DogSize;
  estimateLabel?: string;
};

export type ListinoPromotion = {
  name: string;
  condition: string;
  benefit: string;
};

export type DogSize = "small" | "medium" | "large" | "giant";

export type ExtraServiceId =
  | "facility_food"
  | "medicine_administration"
  | "bath_before_pickup"
  | "local_transport";

export type BookingPricingConfig = {
  maxDogsPerBooking: number;
  secondDogDiscountPercent: number;
  dayCareRateCents: number;
  overnightRateTiers: Array<{
    minNights: number;
    label: string;
    amountCents: number;
  }>;
};

export type ListinoConfig = {
  dailyRates: ListinoPriceRow[];
  overnightRates: ListinoPriceRow[];
  extraServices: ListinoPriceRow[];
  promotions: ListinoPromotion[];
  conditions: string[];
  bookingPricing: BookingPricingConfig;
};

export const dailyRates: ListinoPriceRow[] = [
  {
    id: "day_care",
    service: "Pensione giornaliera",
    details: "Ingresso mattina, uscita entro sera, area sgambamento inclusa",
    price: "EUR 20",
    amountCents: 2000,
    billingUnit: "per_day",
  },
  {
    id: "half_day",
    service: "Mezza giornata",
    details: "Fino a 5 ore di permanenza, ideale per inserimenti graduali",
    price: "EUR 14",
    amountCents: 1400,
    billingUnit: "per_day",
  },
  {
    id: "day_care_with_meal",
    service: "Giornata con pasto",
    details: "Asilo giornaliero con somministrazione pappa fornita dal cliente",
    price: "EUR 25",
    amountCents: 2500,
    billingUnit: "per_day",
  },
];

export const overnightRates: ListinoPriceRow[] = [
  {
    id: "overnight_1_3",
    service: "Pensione notturna 1-3 notti",
    details: "Tariffa per soggiorni brevi consecutivi, box dedicato e gestione quotidiana",
    price: "EUR 28 / notte",
    amountCents: 2800,
    billingUnit: "per_night",
  },
  {
    id: "overnight_4_6",
    service: "Pensione notturna 4-6 notti",
    details: "Tariffa ridotta per soggiorni consecutivi di media durata",
    price: "EUR 25 / notte",
    amountCents: 2500,
    billingUnit: "per_night",
  },
  {
    id: "overnight_7_13",
    service: "Pensione notturna 7-13 notti",
    details: "Tariffa ridotta per una settimana o piu di permanenza continuativa",
    price: "EUR 22 / notte",
    amountCents: 2200,
    billingUnit: "per_night",
  },
  {
    id: "overnight_14_plus",
    service: "Pensione notturna 14+ notti",
    details: "Tariffa piu conveniente per soggiorni lunghi consecutivi",
    price: "EUR 20 / notte",
    amountCents: 2000,
    billingUnit: "per_night",
  },
];

export const extraServices: ListinoPriceRow[] = [
  {
    id: "facility_food",
    service: "Alimentazione fornita dalla struttura",
    details: "Crocchette standard della pensione, salvo esigenze specifiche",
    price: "EUR 4 / giorno",
    amountCents: 400,
    billingUnit: "per_day_per_dog",
  },
  {
    id: "medicine_administration",
    service: "Somministrazione farmaci",
    details: "Secondo indicazioni scritte del proprietario",
    price: "EUR 3 / giorno",
    amountCents: 300,
    billingUnit: "per_day_per_dog",
  },
  {
    id: "bath_before_pickup",
    service: "Bagnetto prima del ritiro",
    details: "Servizio su prenotazione, disponibilita da confermare",
    price: "Da EUR 18",
    amountCents: 1800,
    billingUnit: "per_dog_once",
    estimateLabel: "Stima calcolata dalla tariffa minima",
  },
  {
    id: "local_transport",
    service: "Ritiro o consegna concordata",
    details: "Servizio locale su appuntamento e in base alla distanza",
    price: "Da EUR 10",
    amountCents: 1000,
    billingUnit: "per_booking",
    estimateLabel: "Stima calcolata dalla tariffa minima",
  },
];

export const promotions: ListinoPromotion[] = [
  {
    name: "Box condiviso famiglia",
    condition:
      "Due cani dello stesso proprietario, gia abituati a stare insieme e compatibili nello stesso box.",
    benefit: "-50% sul secondo cane",
  },
  {
    name: "Tariffa progressiva",
    condition: "Permanenze notturne continuative nello stesso soggiorno.",
    benefit: "Prezzo per notte decrescente",
  },
  {
    name: "Inserimento cuccioli",
    condition:
      "Prima esperienza in struttura con mezza giornata conoscitiva prima del soggiorno.",
    benefit: "Prima mezza giornata EUR 10",
  },
];

export const conditions: string[] = [
  "Le tariffe sono indicative e possono variare in base a periodo, durata del soggiorno e necessita specifiche del cane.",
  "Ogni prenotazione occupa un solo box. Piu cani possono stare nella stessa prenotazione solo se compatibili tra loro e appartenenti allo stesso nucleo familiare.",
  "Per soggiorni notturni il giorno di uscita non viene conteggiato come notte, salvo permanenza prolungata oltre l'orario concordato.",
  "Il cibo portato dal proprietario deve essere porzionato o accompagnato da indicazioni chiare sulle quantita giornaliere.",
  "Farmaci, integratori e terapie vengono somministrati solo con istruzioni scritte e confezioni riconoscibili.",
  "Nei periodi di alta richiesta puo essere richiesta una caparra per confermare il posto.",
  "Vaccinazioni, trattamenti antiparassitari e condizioni sanitarie devono essere in regola prima dell'ingresso in struttura.",
];

export const bookingPricing: BookingPricingConfig = {
  maxDogsPerBooking: 2,
  secondDogDiscountPercent: 50,
  dayCareRateCents: 2000,
  overnightRateTiers: [
    { minNights: 1, label: "1-3 notti", amountCents: 2800 },
    { minNights: 4, label: "4-6 notti", amountCents: 2500 },
    { minNights: 7, label: "7-13 notti", amountCents: 2200 },
    { minNights: 14, label: "14+ notti", amountCents: 2000 },
  ],
};

export const listinoConfig: ListinoConfig = {
  dailyRates,
  overnightRates,
  extraServices,
  promotions,
  conditions,
  bookingPricing,
};
