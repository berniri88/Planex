import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadItemInfo(item: any) {
  const content = `
==========================================
PLANEX — DETALLES DEL ITEM
==========================================
Nombre: ${item.name}
Categoría: ${item.type}
Estado: ${item.status}
------------------------------------------
TIEMPO:
Inicio: ${new Date(item.start_time).toLocaleString('es-ES')}
Fin: ${item.end_time ? new Date(item.end_time).toLocaleString('es-ES') : 'N/A'}
Zona Horaria: ${item.timezone}
------------------------------------------
UBICACIÓN:
Ubicación: ${item.location?.address || 'N/A'}
Origen: ${item.origin?.address || 'N/A'}
Destino: ${item.destination?.address || 'N/A'}
------------------------------------------
INFORMACIÓN ADICIONAL:
Referencia: ${item.reservation_ref || 'N/A'}
Costo Estimado: ${item.estimated_cost || 0} ${item.currency || 'USD'}
Costo Real: ${item.real_cost || 0} ${item.currency || 'USD'}
Estado de Pago: ${item.payment_status || 'N/A'}
Notas: ${item.notes || 'N/A'}
------------------------------------------
${item.description ? `DESCRIPCIÓN:\n${item.description}` : ''}
==========================================
Generado por Planex - ${new Date().toLocaleDateString()}
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planex_${item.name.replace(/\s+/g, '_').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
