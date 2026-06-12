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
  maxDogsPerBox: number;
  maxDogsPerBooking: number;
  secondDogDiscountPercent: number;
  longStayMinNights: number;
  longStayDiscountPercent: number;
  dayCareRateCents: number;
  overnightRatesBySize: Record<DogSize, number>;
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
    price: "EUR 22",
    amountCents: 2200,
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
    id: "overnight_small",
    service: "Pensione notturna cane piccolo",
    details: "Box dedicato, gestione quotidiana e area esterna",
    price: "EUR 28 / notte",
    amountCents: 2800,
    billingUnit: "per_night",
    dogSize: "small",
  },
  {
    id: "overnight_medium",
    service: "Pensione notturna cane medio",
    details: "Box dedicato, gestione quotidiana e area esterna",
    price: "EUR 32 / notte",
    amountCents: 3200,
    billingUnit: "per_night",
    dogSize: "medium",
  },
  {
    id: "overnight_large",
    service: "Pensione notturna cane grande",
    details: "Box dedicato, gestione quotidiana e area esterna",
    price: "EUR 36 / notte",
    amountCents: 3600,
    billingUnit: "per_night",
    dogSize: "large",
  },
  {
    id: "overnight_giant",
    service: "Cane gigante o gestione speciale",
    details: "Per soggetti molto grandi o con necessita di routine dedicate",
    price: "Da EUR 40 / notte",
    amountCents: 4000,
    billingUnit: "per_night",
    dogSize: "giant",
    estimateLabel: "Stima calcolata dalla tariffa minima",
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
      "Due cani dello stesso proprietario, gia abituati a stare insieme e compatibili in box.",
    benefit: "-20% sul secondo cane",
  },
  {
    name: "Soggiorni lunghi",
    condition: "Permanenze continuative superiori a 5 notti.",
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

export const bookingPricing: BookingPricingConfig = {
  maxDogsPerBox: 2,
  maxDogsPerBooking: 2,
  secondDogDiscountPercent: 20,
  longStayMinNights: 6,
  longStayDiscountPercent: 10,
  dayCareRateCents: 2200,
  overnightRatesBySize: {
    small: 2800,
    medium: 3200,
    large: 3600,
    giant: 4000,
  },
};

export const listinoConfig: ListinoConfig = {
  dailyRates,
  overnightRates,
  extraServices,
  promotions,
  conditions,
  bookingPricing,
};
