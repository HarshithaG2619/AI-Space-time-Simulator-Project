DT.onReady(()=>{const header=document.querySelector('.js-header');if(!header){DT.getHeaderOffset=()=>0;return}
let offsets;try{offsets=JSON.parse(header.getAttribute('data-header-offsets'))}catch(error){DT.log('error','Failed to parse header offsets',error);DT.getHeaderOffset=()=>0;return}
const getOffsetElement=(offset)=>{if(!DT.isNullish(offset.element))return offset.element;const element=document.querySelector(offset.selector);if(!element){DT.log('log',`Element not found for selector: ${offset.selector}`)}
return element};for(const offset of offsets){offset.element=getOffsetElement(offset);offset.matchMedia=window.matchMedia(offset.mediaQuery)}
DT.getHeaderOffset=()=>{let headerOffset=0;for(const offset of offsets){if(offset.matchMedia.matches){headerOffset=offset.element?.offsetHeight??0}}
return headerOffset??0}})