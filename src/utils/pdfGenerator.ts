import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Pedido } from '../api/orders';

interface PDFOptions {
  pedido: Pedido;
  sucursalDestino?: string;
}

export function generarOrdenCompraPDF({ pedido, sucursalDestino }: PDFOptions) {
  const doc = new jsPDF();
  
  // Configuración de colores
  const primaryColor: [number, number, number] = [30, 64, 175]; // blue-700
  const grayDark: [number, number, number] = [55, 65, 81]; // gray-700
  const grayLight: [number, number, number] = [229, 231, 235]; // gray-200
  
  // Header con fondo azul
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo/Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE COMPRA', 105, 15, { align: 'center' });
  
  // Subtítulo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión de Stock', 105, 25, { align: 'center' });
  
  // Número de orden y fecha
  doc.setFontSize(10);
  doc.text(`Orden N°: ${pedido.id.toString().padStart(6, '0')}`, 105, 33, { align: 'center' });
  
  // Información de la orden
  doc.setTextColor(...grayDark);
  let yPos = 50;
  
  // Box con información general
  doc.setDrawColor(...grayLight);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, 180, 35);
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Información de la Orden', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Fecha
  const fecha = new Date(pedido.fecha_creacion).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha: ${fecha}`, 20, yPos);
  
  yPos += 6;
  // Sucursal destino
  doc.text(`Destino: ${sucursalDestino || pedido.destino_nombre || `Sucursal ${pedido.destino}`}`, 20, yPos);
  
  yPos += 6;
  // Estado
  const estadoTexto = pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1);
  doc.text(`Estado: ${estadoTexto}`, 20, yPos);
  
  // Tabla de productos
  yPos += 15;
  
  // Preparar datos de la tabla
  const tableData = pedido.items.map(item => {
    const precioUnitario = parseFloat(item.precio_costo_momento);
    const subtotal = precioUnitario * item.cantidad;
    
    return [
      item.producto_nombre,
      item.cantidad.toString(),
      `$${precioUnitario.toFixed(2)}`,
      `$${subtotal.toFixed(2)}`
    ];
  });
  
  // Calcular total
  const total = pedido.items.reduce((sum, item) => {
    return sum + (parseFloat(item.precio_costo_momento) * item.cantidad);
  }, 0);
  
  // Generar tabla
  autoTable(doc, {
    startY: yPos,
    head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    foot: [['', '', 'TOTAL:', `$${total.toFixed(2)}`]],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: grayDark
    },
    footStyles: {
      fillColor: [229, 231, 235],
      textColor: grayDark,
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'right'
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 15, right: 15 }
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
  
  // Línea separadora
  doc.setDrawColor(...grayLight);
  doc.setLineWidth(0.5);
  doc.line(15, finalY + 15, 195, finalY + 15);
  
  // Texto del footer
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // gray-500
  doc.setFont('helvetica', 'italic');
  doc.text('Este documento ha sido generado automáticamente por el Sistema de Gestión de Stock', 105, finalY + 22, { align: 'center' });
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 105, finalY + 28, { align: 'center' });
  
  // Generar nombre del archivo
  const fileName = `Orden_Compra_${pedido.id.toString().padStart(6, '0')}.pdf`;
  
  // Retornar el PDF como Blob y el nombre del archivo
  const pdfBlob = doc.output('blob');
  
  return { blob: pdfBlob, fileName };
}

// Función para descargar el PDF directamente (para uso manual)
export function descargarPDF(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
