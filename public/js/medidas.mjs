// Largura de um elemento, para os gráficos desenharem em pixels reais e o texto nunca encolher no celular.
const { useState, useRef, useEffect } = window.htmPreact;

export function usarLargura(padrao = 640) {
  const ref = useRef(), [largura, setLargura] = useState(padrao);
  useEffect(() => {
    if (!ref.current || !window.ResizeObserver) return;
    const observador = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width) || padrao));
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, []);
  return [ref, largura];
}
