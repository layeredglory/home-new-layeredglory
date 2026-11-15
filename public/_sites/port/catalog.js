/* The supplier-approved product definitions are the only catalog source used by the form. */
'use strict';
window.HONGJU_PRODUCTS = Object.freeze([
  { id: 'gui15', name: '1++ 한우암소 구이세트 15만원', price: 150000, cuts: ['등심', '부채', '업진', '치마'], addition: '' },
  { id: 'gui20', name: '1++ 한우암소 구이세트 20만원', price: 200000, cuts: ['등심', '부채', '업진', '치마'], addition: '' },
  { id: 'gui30', name: '1++ 한우암소 구이세트 30만원', price: 300000, cuts: ['등심', '부채', '업진', '치마'], addition: '살치살 또는 꽃갈비살 중 한 가지 포함' },
  { id: 'galbi30', name: '1++ 한우암소 갈비구이세트 30만원', price: 300000, cuts: ['늑간살', '꽃갈비살', '살치살', '치마살'], addition: '' }
].map(product => Object.freeze({ ...product, cuts: Object.freeze(product.cuts) })));
