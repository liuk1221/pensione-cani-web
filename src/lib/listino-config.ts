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
    price: "EUR 15",
    amountCents: 1500,
    billingUnit: "per_day",
  },
  {
    id: "half_day",
    service: "Mezza giornata",
    details: "Fino a 5 ore di permanenza, ideale per inserimenti graduali",
    price: "EUR 10",
    amountCents: 1000,
    billingUnit: "per_day",
  },
  // {
  //   id: "day_care_with_meal",
  //   service: "Giornata con pasto",
  //   details: "Asilo giornaliero con somministrazione pappa fornita dal cliente",
  //   price: "EUR 25",
  //   amountCents: 2500,
  //   billingUnit: "per_day",
  // },
];

export const overnightRates: ListinoPriceRow[] = [
  {
    id: "overnight_1_3",
    service: "Pensione notturna 1-3 notti",
    details: "Tariffa per soggiorni brevi consecutivi, box dedicato e gestione quotidiana",
    price: "EUR 20 / notte",
    amountCents: 2000,
    billingUnit: "per_night",
  },
  {
    id: "overnight_4_6",
    service: "Pensione notturna 4-6 notti",
    details: "Tariffa ridotta per soggiorni consecutivi di media durata",
    price: "EUR 18 / notte",
    amountCents: 1800,
    billingUnit: "per_night",
  },
  {
    id: "overnight_7_13",
    service: "Pensione notturna 7-13 notti",
    details: "Tariffa ridotta per una settimana o piu di permanenza continuativa",
    price: "EUR 16 / notte",
    amountCents: 1600,
    billingUnit: "per_night",
  },
  {
    id: "overnight_14_plus",
    service: "Pensione notturna 14+ notti",
    details: "Tariffa piu conveniente per soggiorni lunghi consecutivi",
    price: "EUR 15 / notte",
    amountCents: 1500,
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
    service: "Somministrazione integratori",
    details: "Secondo indicazioni scritte del proprietario",
    price: "EUR 3 / giorno",
    amountCents: 300,
    billingUnit: "per_day_per_dog",
  },
  {
    id: "local_transport",
    service: "Ritiro o consegna concordata",
    details: "Servizio locale su appuntamento e in base alla distanza (comune di Fabriano (AN)).",
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
];

export const conditions: string[] = [
  "Le tariffe sono indicative e possono variare in base a periodo, durata del soggiorno e necessita specifiche del cane.",
  "Ogni prenotazione occupa un solo box. Piu cani possono stare nella stessa prenotazione solo se compatibili tra loro e appartenenti allo stesso nucleo familiare.",
  "Per soggiorni notturni il giorno di uscita non viene conteggiato come notte, salvo permanenza prolungata oltre l'orario concordato.",
  "Il cibo portato dal proprietario deve essere porzionato o accompagnato da indicazioni chiare sulle quantita giornaliere.",
  "Integratori e terapie vengono somministrati solo con istruzioni scritte e confezioni riconoscibili.",
  "Nei periodi di alta richiesta puo essere richiesta una caparra per confermare il posto.",
  "Vaccinazioni, trattamenti antiparassitari e condizioni sanitarie devono essere in regola prima dell'ingresso in struttura.",
];

export const bookingPricing: BookingPricingConfig = {
  maxDogsPerBooking: 2,
  secondDogDiscountPercent: 50,
  dayCareRateCents: 1500,
  overnightRateTiers: [
    { minNights: 1, label: "1-3 notti", amountCents: 2000 },
    { minNights: 4, label: "4-6 notti", amountCents: 1800 },
    { minNights: 7, label: "7-13 notti", amountCents: 1600 },
    { minNights: 14, label: "14+ notti", amountCents: 1500 },
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
