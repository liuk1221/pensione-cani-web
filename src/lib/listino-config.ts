export type ListinoPriceRow = {
  id?: string;
  service: string;
  details: string;
  price: string;
  amountCents?: number;
  billingUnit?: "per_day" | "per_night" | "per_day_per_dog" | "per_dog_once" | "per_booking";
  dogSize?: DogSize;
  estimateLabel?: string;
  selectable?: boolean;
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
  | "local_transport"
  | "late_pickup";

export type BookingPricingConfig = {
  maxDogsPerBooking: number;
  secondDogDiscountPercent: number;
  fullRateNights: number;
  fullNightlyRateCents: number;
  reducedNightlyRateCents: number;
};

export type ListinoConfig = {
  overnightRates: ListinoPriceRow[];
  extraServices: ListinoPriceRow[];
  promotions: ListinoPromotion[];
  conditions: string[];
  bookingPricing: BookingPricingConfig;
};

export const overnightRates: ListinoPriceRow[] = [
  {
    id: "overnight_first_7",
    service: "Prime 7 notti",
    details: "Tariffa applicata a ciascuna delle prime sette notti del soggiorno",
    price: "EUR 20 / notte",
    amountCents: 2000,
    billingUnit: "per_night",
  },
  {
    id: "overnight_after_7",
    service: "Dall'ottava notte",
    details: "Tariffa applicata a tutte le notti successive alle prime sette",
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
  {
    id: "late_pickup",
    service: "Late pickup",
    details: "Supplemento per il ritiro dopo le 11:00.",
    price: "EUR 10",
    amountCents: 1000,
    billingUnit: "per_booking",
    selectable: false,
  },
];

export const selectableExtraServices = extraServices.filter(
  (service) => service.selectable !== false,
);

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
    benefit: "EUR 15 dalla 8a notte",
  },
];

export const conditions: string[] = [
  "La struttura dispone di 3 box esterni in area dedicata con giardino privato e di ulteriori box interni situati in una zona separata e coperta. La scelta del box viene assegnata in base all’ordine di arrivo delle prenotazioni. In assenza di preferenze espresse dal proprietario, la struttura assegnerà prioritariamente i box esterni e, successivamente, quelli interni.",
  "Le tariffe sono indicative e possono variare in base a periodo, durata del soggiorno e necessita specifiche del cane.",
  "Ogni prenotazione occupa un solo box. Piu cani possono stare nella stessa prenotazione solo se compatibili tra loro e appartenenti allo stesso nucleo familiare.",
  "Ogni prenotazione deve includere almeno una notte. Il giorno di uscita non viene conteggiato come notte; per il ritiro dopo le 11:00 si applica il supplemento late pickup di EUR 10.",
  "Il cibo portato dal proprietario deve essere porzionato o accompagnato da indicazioni chiare sulle quantita giornaliere.",
  "Integratori e terapie vengono somministrati solo con istruzioni scritte e confezioni riconoscibili.",
  "Nei periodi di alta richiesta puo essere richiesta una caparra per confermare il posto.",
  "Vaccinazioni, trattamenti antiparassitari e condizioni sanitarie devono essere in regola prima dell'ingresso in struttura.",
];

export const bookingPricing: BookingPricingConfig = {
  maxDogsPerBooking: 2,
  secondDogDiscountPercent: 50,
  fullRateNights: 7,
  fullNightlyRateCents: 2000,
  reducedNightlyRateCents: 1500,
};

export const listinoConfig: ListinoConfig = {
  overnightRates,
  extraServices,
  promotions,
  conditions,
  bookingPricing,
};
