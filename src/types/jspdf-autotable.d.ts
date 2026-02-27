declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    html?: string | HTMLTableElement;
    head?: RowInput[];
    body?: RowInput[];
    foot?: RowInput[];
    startY?: number | false;
    margin?: number | MarginPadding;
    pageBreak?: 'auto' | 'avoid' | 'always';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    theme?: 'striped' | 'grid' | 'plain';
    includeHiddenHtml?: boolean;
    horizontalPageBreak?: boolean;
    horizontalPageBreakRepeat?: number | number[];
    styles?: Partial<Styles>;
    bodyStyles?: Partial<Styles>;
    alternateRowStyles?: Partial<Styles>;
    columnStyles?: { [key: string | number]: Partial<Styles> };
    headStyles?: Partial<Styles>;
    footStyles?: Partial<Styles>;
    didDrawPage?: (data: CellHookData) => void;
    didDrawCell?: (data: CellHookData) => void;
    willDrawCell?: (data: CellHookData) => void;
    didParseCell?: (data: CellHookData) => void;
  }

  type RowInput = CellDef | string | number | (string | number | CellDef)[];
  type CellDef = {
    content?: string | number;
    colSpan?: number;
    rowSpan?: number;
    styles?: Partial<Styles>;
  };

  interface MarginPadding {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    horizontal?: number;
    vertical?: number;
  }

  interface Styles {
    font: 'helvetica' | 'times' | 'courier';
    fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
    overflow: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    fillColor: number | number[] | string | false;
    textColor: number | number[] | string;
    cellPadding: number | MarginPadding;
    halign: 'left' | 'center' | 'right';
    valign: 'top' | 'middle' | 'bottom';
    fontSize: number;
    cellWidth: 'auto' | 'wrap' | number;
    minCellHeight: number;
    minCellWidth: number;
    lineColor: number | number[] | string;
    lineWidth: number;
  }

  interface CellHookData {
    cell: Cell;
    row: Row;
    column: Column;
    section: 'head' | 'body' | 'foot';
  }

  interface Cell {
    raw: string | number;
    text: string[];
    x: number;
    y: number;
    width: number;
    height: number;
    styles: Styles;
  }

  interface Row {
    raw: RowInput;
    index: number;
    section: 'head' | 'body' | 'foot';
    cells: { [key: string]: Cell };
    height: number;
  }

  interface Column {
    dataKey: string | number;
    index: number;
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}
