import { districts_en, upazilas_en } from 'bangladesh-location-data'

console.log('Districts:', Object.keys(districts_en).map(k => districts_en[k].slice(0, 1)));
console.log('Upazilas keys:', Object.keys(upazilas_en).slice(0, 3));
console.log('Sample Upazilas:', upazilas_en[Object.keys(upazilas_en)[0]]);
