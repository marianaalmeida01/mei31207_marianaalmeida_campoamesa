// Hook reutilizável: milissegundos que faltam até uma data (atualiza a cada segundo).
// O servidor só envia "terminaEm"; cada browser calcula o tempo restante.
import { useEffect, useState } from 'react';

export function useTempoRestante(terminaEm) {
  const calcular = () => (terminaEm ? Math.max(0, new Date(terminaEm) - Date.now()) : 0);
  const [ms, setMs] = useState(calcular);

  useEffect(() => {
    setMs(calcular());
    const intervalo = setInterval(() => setMs(calcular()), 1000);
    return () => clearInterval(intervalo); // limpa o relógio quando o componente sai do ecrã
  }, [terminaEm]);

  return ms;
}

// 125000 ms -> "02:05"; 3725000 ms -> "1:02:05"
export function formatar(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}