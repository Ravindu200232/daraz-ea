/**
 * The prototype's own pictures, kept verbatim.
 *
 * Every product photo, category picture and gallery image in the approved prototype is a real
 * Unsplash URL with its own crop query. The application reuses these exact strings so the
 * storefront and the management tables show the same pictures as the approved screens — never a
 * placeholder, a generated image or a different crop.
 */

const UNSPLASH_P1 = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1';
const UNSPLASH_P2 = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c';
const UNSPLASH_P3 = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c';
const UNSPLASH_P4 = 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1';
const UNSPLASH_P5 = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d';
const UNSPLASH_P6 = 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2';
const UNSPLASH_P7 = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7';
const UNSPLASH_P8 = 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0';
const UNSPLASH_P9 = 'https://images.unsplash.com/photo-1483985988355-763728e1935b';
const UNSPLASH_P10 = 'https://images.unsplash.com/photo-1445205170230-053b83016050';
const UNSPLASH_P11 = 'https://images.unsplash.com/photo-1560769629-975ec94e6a86';
const UNSPLASH_P12 = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace';
const UNSPLASH_P13 = 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa';
const UNSPLASH_P14 = 'https://images.unsplash.com/photo-1551163943-3f6a855d1153';
const UNSPLASH_P15 = 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26';
const UNSPLASH_P16 = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8';
const UNSPLASH_P17 = 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8';
const UNSPLASH_P18 = 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992';
const UNSPLASH_P19 = 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495';
const UNSPLASH_P20 = 'https://images.unsplash.com/photo-1591561954557-26941169b49e';
const UNSPLASH_P21 = 'https://images.unsplash.com/photo-1551803091-e20673f15770';
const UNSPLASH_P22 = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab';
const UNSPLASH_P23 = 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf';
const UNSPLASH_P24 = 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10';
const UNSPLASH_P25 = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
const UNSPLASH_P26 = 'https://images.unsplash.com/photo-1583394838336-acd977736f90';
const UNSPLASH_P27 = 'https://images.unsplash.com/photo-1600166898405-da9535204843';
const UNSPLASH_P28 = 'https://images.unsplash.com/photo-1517705008128-361805f42e86';
const UNSPLASH_P29 = 'https://images.unsplash.com/photo-1602143407151-7111542de6e8';
const UNSPLASH_P30 = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3';
const UNSPLASH_P31 = 'https://images.unsplash.com/photo-1580910051074-3eb694886505';
const UNSPLASH_P32 = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
const UNSPLASH_P33 = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136';
const UNSPLASH_P34 = 'https://images.unsplash.com/photo-1584990347449-a2d4c2c2b0a9';
const UNSPLASH_P35 = 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d';
const UNSPLASH_P36 = 'https://images.unsplash.com/photo-1519689680058-324335c77eba';
const UNSPLASH_P37 = 'https://images.unsplash.com/photo-1558060370-d644479cb6f7';
const UNSPLASH_P38 = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8';
const UNSPLASH_P39 = 'https://images.unsplash.com/photo-1503341504253-dff4815485f1';
const UNSPLASH_P40 = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f';
const UNSPLASH_P41 = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f';

/** The uploaded reference image, served unchanged from the application's own public folder. */
export const LOGO = '/assets/uploads/3b870cb043c7f8a9741cbf66329e294e.png';

export function photo(base, width = 600, quality = 70) {
  return `${base}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export const P = {
  P1: UNSPLASH_P1, P2: UNSPLASH_P2, P3: UNSPLASH_P3, P4: UNSPLASH_P4, P5: UNSPLASH_P5,
  P6: UNSPLASH_P6, P7: UNSPLASH_P7, P8: UNSPLASH_P8, P9: UNSPLASH_P9, P10: UNSPLASH_P10,
  P11: UNSPLASH_P11, P12: UNSPLASH_P12, P13: UNSPLASH_P13, P14: UNSPLASH_P14, P15: UNSPLASH_P15,
  P16: UNSPLASH_P16, P17: UNSPLASH_P17, P18: UNSPLASH_P18, P19: UNSPLASH_P19, P20: UNSPLASH_P20,
  P21: UNSPLASH_P21, P22: UNSPLASH_P22, P23: UNSPLASH_P23, P24: UNSPLASH_P24, P25: UNSPLASH_P25,
  P26: UNSPLASH_P26, P27: UNSPLASH_P27, P28: UNSPLASH_P28, P29: UNSPLASH_P29, P30: UNSPLASH_P30,
  P31: UNSPLASH_P31, P32: UNSPLASH_P32, P33: UNSPLASH_P33, P34: UNSPLASH_P34, P35: UNSPLASH_P35,
  P36: UNSPLASH_P36, P37: UNSPLASH_P37, P38: UNSPLASH_P38, P39: UNSPLASH_P39, P40: UNSPLASH_P40,
  P41: UNSPLASH_P41,
};

export const IMAGE_KEYS = Object.keys(P);

/** The picture each seeded product uses, so a seeded catalogue looks like the approved screens. */
export const PRODUCT_PHOTOS = {
  'handloom-cotton-kurta': [P.P1, P.P22, P.P23],
  'kandyan-handloom-saree': [P.P2, P.P15, P.P24],
  'mens-linen-shirt': [P.P3, P.P22, P.P23],
  'leather-sandals': [P.P4, P.P24, P.P20],
  'ceylon-cinnamon-gift-pack': [P.P5, P.P28, P.P29],
  'rattan-storage-basket': [P.P6, P.P7, P.P12],
  'batik-cushion-cover-set': [P.P7, P.P12, P.P6],
  'denim-jacket': [P.P8, P.P39, P.P40],
  'linen-kurta-indigo': [P.P1, P.P18, P.P22],
  'pleated-midi-skirt': [P.P13, P.P21, P.P16],
  'block-print-cotton-blouse': [P.P14, P.P18, P.P21],
  'handloom-cotton-saree-peach': [P.P2, P.P16, P.P15],
  'cropped-denim-jacket': [P.P8, P.P40, P.P39],
  'silk-blend-scarf': [P.P15, P.P21, P.P18],
  'tiered-cotton-dress': [P.P16, P.P13, P.P14],
  'batik-wrap-skirt': [P.P17, P.P13, P.P16],
  'ribbed-knit-top': [P.P18, P.P22, P.P21],
  'straight-leg-trousers': [P.P19, P.P1, P.P13],
  'everyday-canvas-tote': [P.P20, P.P7, P.P12],
  'embroidered-kaftan-blouse': [P.P21, P.P14, P.P18],
  'everyday-cotton-panjabi': [P.P3, P.P22, P.P23],
  'classic-cotton-tee': [P.P22, P.P39, P.P40],
  'ceramic-dinner-set': [P.P29, P.P28, P.P27],
  'wireless-earbuds': [P.P26, P.P25, P.P41],
  'running-shoes': [P.P25, P.P11, P.P4],
  'canvas-tote-bag': [P.P20, P.P6, P.P7],
  'cotton-bath-towel-set': [P.P27, P.P29, P.P28],
  'meridian-cotton-oxford-shirt': [P.P3, P.P22, P.P23, P.P24],
  'lumora-cotton-kurta': [P.P1, P.P18, P.P22],
  'riva-linen-shirt': [P.P3, P.P22],
  'kenda-canvas-sneakers': [P.P11, P.P25],
  'solis-ceramic-mug-set': [P.P28, P.P29],
  'linen-kurta-shirt': [P.P1, P.P19],
  'aero-running-shoes': [P.P25, P.P11],
  'stainless-steel-water-bottle': [P.P29],
  'rechargeable-table-lamp': [P.P28],
  'handloom-cotton-panjabi-navy': [P.P3, P.P22, P.P23],
  'steel-water-bottle': [P.P29],
  'bela-handwoven-throw': [P.P6, P.P7],
};

export const CATEGORY_IMAGES = {
  electronics: P.P38,
  'mobile-phones': P.P30,
  'phone-cases': P.P31,
  audio: P.P32,
  'home-kitchen': P.P33,
  cookware: P.P34,
  'small-appliances': P.P35,
  fashion: P.P9,
  'mens-clothing': P.P10,
  'womens-clothing': P.P2,
  'baby-toys': P.P36,
  toys: P.P37,
};

export function productPhotos(slug) {
  return PRODUCT_PHOTOS[slug] || [P.P3, P.P22, P.P23];
}

export function categoryImage(slug) {
  return CATEGORY_IMAGES[slug] || null;
}
