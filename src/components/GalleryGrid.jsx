import React from 'react';
import { FloatingFrame } from './FloatingFrame';
export function GalleryGrid({ items, labels }) {
  return items.map((item, index) => <FloatingFrame key={item.id} index={index}>
    <button className="photo-open" data-photo={item.id} aria-label={`View ${item.title}`}>
      <img src={item.image} width={item.width} height={item.height} alt={`${item.title} — Kenneth Harris archive`} loading="lazy" decoding="async" />
      <span className="expand-icon" aria-hidden="true">↗</span>
    </button>
    <figcaption className="photo-caption"><p className="mono">{labels[item.category]} / {item.id.split('-').pop()}</p><h3>{item.title}</h3><div className="photo-actions"><button data-acquire={item.id}>Acquire print ↗</button><button data-license={item.id}>License image ↗</button></div></figcaption>
  </FloatingFrame>);
}
