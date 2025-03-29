export function romanize(num: number): string {
  if (isNaN(num)) return 'NaN';
  
  const roman = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1
  };
  
  let str = '';
  
  for (let i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i as keyof typeof roman]);
    num -= q * roman[i as keyof typeof roman];
    str += i.repeat(q);
  }
  
  return str;
} 