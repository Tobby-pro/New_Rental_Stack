export type PropertyFormData = {
  address: string;
  city: string;
  state: string;
  price: number | string; // Make sure this matches what you're submitting
  bedrooms: number | string; // Same here
  bathrooms: number | string; // And here
};