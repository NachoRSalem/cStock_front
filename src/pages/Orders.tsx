// src/pages/Orders.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  createPedido, 
  enviarARevision, 
  listPedidos, 
  aprobarPedido, 
  rechazarPedido, 
  recibirPedido,
  getPedido,
  updatePedido,
  deletePedido,
  getDisponibilidadSucursales,
  type Pedido, 
  type PedidoItemCreate,
  type DisponibilidadSucursal,
} from "../api/orders";
import { listProductos, type Producto } from "../api/products";
import { listSucursales, type Sucursal, type SubUbicacion } from "../api/locations";
import { listStock, type Stock as StockItem } from "../api/stock";
import { tokenStorage } from "../utils/storage";
import { generarOrdenCompraPDF, descargarPDF } from "../utils/pdfGenerator";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardBody, 
  CardFooter, 
  Button, 
  Badge, 
  Input, 
  Modal, 
  ModalFooter,
  PageLoader,
  Alert,
  ConfirmDialog
} from "../components/ui";
import { Plus, Send, Check, X, Package, Trash2, Calendar, MapPin, FileDown, Edit, ChevronDown, ChevronUp, Filter, List, Search } from "lucide-react";
import clsx from 'clsx';

type PedidoItemForm = {
  producto: number;
  cantidad: number;
  precio_costo_momento: string;
};

export default function Orders() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  const [showCreate, setShowCreate] = useState(false);
  const [destino, setDestino] = useState<number | null>(null);
  const [items, setItems] = useState<PedidoItemForm[]>([]);
  const [origenTipoCreate, setOrigenTipoCreate] = useState<'distribuidor' | 'sucursal'>('distribuidor');
  const [origenSucursalCreate, setOrigenSucursalCreate] = useState<number | null>(null);

  // Estados para el modal de recibir pedido
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [pedidoToReceive, setPedidoToReceive] = useState<Pedido | null>(null);
  const [subUbicaciones, setSubUbicaciones] = useState<SubUbicacion[]>([]);
  const [destinos, setDestinos] = useState<Record<number, number>>({});
  const [receiveBusy, setReceiveBusy] = useState(false);

  // Estados para ConfirmDialogs
  const [showEnviarConfirm, setShowEnviarConfirm] = useState(false);
  const [showRechazarConfirm, setShowRechazarConfirm] = useState(false);
  const [showCancelarConfirm, setShowCancelarConfirm] = useState(false);
  const [pedidoAction, setPedidoAction] = useState<number | null>(null);

  // Estados para aprobación con selección de almacén
  const [showAprobarOrigenModal, setShowAprobarOrigenModal] = useState(false);
  const [showAprobarAlmacenModal, setShowAprobarAlmacenModal] = useState(false);
  const [showAprobarSucursalModal, setShowAprobarSucursalModal] = useState(false);
  const [pedidoToApprove, setPedidoToApprove] = useState<Pedido | null>(null);
  const [almacenUbicaciones, setAlmacenUbicaciones] = useState<Record<number, number>>({}); // pedidoitem_id -> sub_ubicacion_id
  const [almacenesDisponibles, setAlmacenesDisponibles] = useState<Sucursal[]>([]); // ubicaciones tipo almacen
  const [almacenStock, setAlmacenStock] = useState<StockItem[]>([]); // stock actual del almacén
  
  // Estados para aprobación desde sucursal
  const [disponibilidadSucursales, setDisponibilidadSucursales] = useState<DisponibilidadSucursal[]>([]);
  const [sucursalOrigenSeleccionada, setSucursalOrigenSeleccionada] = useState<number | null>(null);
  const [sucursalOrigenStock, setSucursalOrigenStock] = useState<StockItem[]>([]);
  const [sucursalUbicaciones, setSucursalUbicaciones] = useState<Record<number, number>>({});

  // Estados para edición de pedido
  const [showEdit, setShowEdit] = useState(false);
  const [pedidoToEdit, setPedidoToEdit] = useState<Pedido | null>(null);

  // Estado para expandir/colapsar lista de productos
  const [expandedPedidos, setExpandedPedidos] = useState<Set<number>>(new Set());

  // Estados para vista paginada y filtros
  const [vistaCompleta, setVistaCompleta] = useState(false);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");
  const [filtroProducto, setFiltroProducto] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroSucursal, setFiltroSucursal] = useState<number | null>(null);
  const [filtroOrigenTipo, setFiltroOrigenTipo] = useState<string>("");

  // Estado para secciones colapsadas
  const [seccionesColapsadas, setSeccionesColapsadas] = useState<Set<string>>(new Set());

  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";

  // Helper: ¿el destino del pedido es un almacén?
  const isAlmacenDestino = (pedido: Pedido) =>
    sucursales.find(s => s.id === pedido.destino)?.tipo === 'almacen';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const [pedidosData, productosData, sucursalesData] = await Promise.all([
        listPedidos(),
        listProductos(),
        listSucursales()
      ]);
      setPedidos(pedidosData);
      setProductos(productosData);
      setSucursales(sucursalesData);
      
      // Debug: mostrar datos de sesión
      console.log('Session data:', session);
      console.log('Sucursales cargadas:', sucursalesData);
      console.log('Productos cargados:', productosData);
      
      // Si es usuario de sucursal, auto-seleccionar su sucursal
      if (!isAdmin && session?.sucursal) {
        // Manejar tanto número como string (por compatibilidad con sesiones antiguas)
        const sucursalId = typeof session.sucursal === 'number' 
          ? session.sucursal 
          : parseInt(session.sucursal as any, 10);
        
        if (!isNaN(sucursalId)) {
          console.log('Setting destino to:', sucursalId);
          setDestino(sucursalId);
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // También inicializar el destino cuando se abre el formulario de crear
  useEffect(() => {
    if (showCreate && !isAdmin && session?.sucursal && !destino) {
      const sucursalId = typeof session.sucursal === 'number' 
        ? session.sucursal 
        : parseInt(session.sucursal as any, 10);
      
      if (!isNaN(sucursalId)) {
        setDestino(sucursalId);
      }
    }
  }, [showCreate, isAdmin, session, destino]);

  function addItem() {
    setItems([...items, { producto: 0, cantidad: 1, precio_costo_momento: "0" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleDescargarPDF(pedido: Pedido) {
    try {
      const pedidoCompleto = await getPedido(pedido.id);
      const sucursalNombre = sucursales.find(s => s.id === pedidoCompleto.destino)?.nombre;
      const { blob, fileName } = generarOrdenCompraPDF({ 
        pedido: pedidoCompleto, 
        sucursalDestino: sucursalNombre 
      });
      descargarPDF(blob, fileName);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setErr('Error al generar el PDF');
    }
  }

  function updateItem(index: number, field: keyof PedidoItemForm, value: any) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    console.log('Items actualizados:', newItems);
  }

  async function onCreate() {
    if (!destino) {
      setErr("Seleccioná un destino");
      return;
    }
    if (items.length === 0) {
      setErr("Agregá al menos un producto");
      return;
    }
    // Validar que todos los productos estén seleccionados
    const productosNoSeleccionados = items.some(item => !item.producto || item.producto === 0);
    if (productosNoSeleccionados) {
      setErr("Todos los productos deben estar seleccionados");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const itemsToSend: PedidoItemCreate[] = items.map(item => {
        const producto = productos.find(p => p.id === item.producto);
        return {
          producto: item.producto,
          cantidad: item.cantidad,
          precio_costo_momento: item.precio_costo_momento || producto?.costo_compra.toString() || "0"
        };
      });

      const pedidoCreado = await createPedido({ 
        destino, 
        items: itemsToSend,
        origen_tipo: origenTipoCreate,
        origen_sucursal: origenTipoCreate === 'sucursal' ? origenSucursalCreate ?? undefined : undefined
      });
      await loadData();
      
      // Si es admin, generar y descargar PDF automáticamente
      if (isAdmin && pedidoCreado.id) {
        try {
          const pedidoCompleto = await getPedido(pedidoCreado.id);
          const sucursalNombre = sucursales.find(s => s.id === destino)?.nombre;
          const { blob, fileName } = generarOrdenCompraPDF({ 
            pedido: pedidoCompleto, 
            sucursalDestino: sucursalNombre 
          });
          descargarPDF(blob, fileName);
        } catch (pdfError) {
          console.error('Error generando PDF:', pdfError);
        }
      }
      
      setShowCreate(false);
      setItems([]);
      setDestino(isAdmin ? null : session?.sucursal ?? null);
      setOrigenTipoCreate('distribuidor');
      setOrigenSucursalCreate(null);
    } catch (e: any) {
      setErr(e?.message ?? "Error creando pedido");
    } finally {
      setBusy(false);
    }
  }

  async function openEditModal(pedido: Pedido) {
    try {
      setBusy(true);
      const pedidoCompleto = await getPedido(pedido.id);
      setPedidoToEdit(pedidoCompleto);
      setDestino(pedidoCompleto.destino);
      // Convertir los items del pedido a formato de formulario
      const itemsForm: PedidoItemForm[] = pedidoCompleto.items.map(item => ({
        producto: item.producto,
        cantidad: item.cantidad,
        precio_costo_momento: item.precio_costo_momento
      }));
      setItems(itemsForm);
      setShowEdit(true);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando pedido");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate() {
    if (!pedidoToEdit) return;
    if (!destino) {
      setErr("Seleccioná un destino");
      return;
    }
    if (items.length === 0) {
      setErr("Agregá al menos un producto");
      return;
    }
    const productosNoSeleccionados = items.some(item => !item.producto || item.producto === 0);
    if (productosNoSeleccionados) {
      setErr("Todos los productos deben estar seleccionados");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const itemsToSend: PedidoItemCreate[] = items.map(item => {
        const producto = productos.find(p => p.id === item.producto);
        return {
          producto: item.producto,
          cantidad: item.cantidad,
          precio_costo_momento: item.precio_costo_momento || producto?.costo_compra.toString() || "0"
        };
      });

      await updatePedido(pedidoToEdit.id, { destino, items: itemsToSend });
      await loadData();
      setShowEdit(false);
      setItems([]);
      setPedidoToEdit(null);
      setDestino(isAdmin ? null : session?.sucursal ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando pedido");
    } finally {
      setBusy(false);
    }
  }

  function onCancelar(id: number) {
    setPedidoAction(id);
    setShowCancelarConfirm(true);
  }

  async function confirmCancelar() {
    if (!pedidoAction) return;
    
    setBusy(true);
    setErr(null);
    setShowCancelarConfirm(false);
    try {
      await deletePedido(pedidoAction);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error cancelando pedido");
    } finally {
      setBusy(false);
      setPedidoAction(null);
    }
  }

  function onEnviarARevision(id: number) {
    setPedidoAction(id);
    setShowEnviarConfirm(true);
  }

  async function confirmEnviarARevision() {
    if (!pedidoAction) return;
    
    setBusy(true);
    setErr(null);
    setShowEnviarConfirm(false);
    try {
      await enviarARevision(pedidoAction);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error enviando a revisión");
    } finally {
      setBusy(false);
      setPedidoAction(null);
    }
  }

  function onAprobar(id: number) {
    // En lugar de abrir directamente el confirm, primero cargamos el pedido completo
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) {
      setPedidoToApprove(pedido);
      setShowAprobarOrigenModal(true);
    }
  }

  async function handleAprobarDesdeAlmacen() {
    // Usuario elige proveer desde almacén, abrir modal para seleccionar sububicaciones
    setShowAprobarOrigenModal(false);
    if (!pedidoToApprove) return;
    
    try {
      setBusy(true);
      // Cargar el pedido completo con items
      const pedidoCompleto = await getPedido(pedidoToApprove.id);
      setPedidoToApprove(pedidoCompleto);
      
      // Filtrar las ubicaciones de tipo 'almacen' ya cargadas
      const almacenes = sucursales.filter(s => s.tipo === 'almacen');
      if (almacenes.length === 0) {
        setErr("No hay ninguna ubicación de tipo 'Almacén Central' registrada. Creala primero desde la sección Ubicaciones.");
        setBusy(false);
        setShowAprobarOrigenModal(true); // reabrimos para que no quede en blanco
        return;
      }
      setAlmacenesDisponibles(almacenes);
      
      // Cargar el stock actual del almacén para mostrar disponibilidad
      const stockResults = await Promise.all(
        almacenes.map(a => listStock({ ubicacion: a.id }))
      );
      setAlmacenStock(stockResults.flat());
      
      // Inicializar almacenUbicaciones vacío
      setAlmacenUbicaciones({});
      setShowAprobarAlmacenModal(true);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando pedido");
    } finally {
      setBusy(false);
    }
  }

  async function handleAprobarDesdeSucursal() {
    // Usuario elige proveer desde otra sucursal
    setShowAprobarOrigenModal(false);
    if (!pedidoToApprove) return;
    
    try {
      setBusy(true);
      // Cargar disponibilidad de sucursales para este pedido
      const disponibilidad = await getDisponibilidadSucursales(pedidoToApprove.id);
      setDisponibilidadSucursales(disponibilidad);
      
      // Cargar el pedido completo
      const pedidoCompleto = await getPedido(pedidoToApprove.id);
      setPedidoToApprove(pedidoCompleto);
      
      setSucursalOrigenSeleccionada(null);
      setSucursalUbicaciones({});
      setShowAprobarSucursalModal(true);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando disponibilidad");
      setShowAprobarOrigenModal(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleSucursalOrigenChange(sucursalId: number) {
    setSucursalOrigenSeleccionada(sucursalId);
    setSucursalUbicaciones({});
    
    try {
      // Cargar el stock de la sucursal seleccionada
      const stock = await listStock({ ubicacion: sucursalId });
      setSucursalOrigenStock(stock);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando stock de sucursal");
    }
  }

  async function handleAprobarExtern() {
    // Usuario elige proveer externamente (distribuidor)
    setShowAprobarOrigenModal(false);
    if (!pedidoToApprove) return;
    
    setBusy(true);
    setErr(null);
    try {
      await aprobarPedido(pedidoToApprove.id, { origen_tipo: 'distribuidor' });
      await loadData();
      
      // Generar y descargar PDF automáticamente
      try {
        const pedidoCompleto = await getPedido(pedidoToApprove.id);
        const sucursalNombre = sucursales.find(s => s.id === pedidoCompleto.destino)?.nombre;
        const { blob, fileName } = generarOrdenCompraPDF({ 
          pedido: pedidoCompleto, 
          sucursalDestino: sucursalNombre 
        });
        descargarPDF(blob, fileName);
      } catch (pdfError) {
        console.error('Error generando PDF:', pdfError);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error aprobando pedido");
    } finally {
      setBusy(false);
      setPedidoToApprove(null);
    }
  }

  async function confirmAprobarDesdeAlmacen() {
    if (!pedidoToApprove) return;
    
    // Validar que todos los items tengan sub_ubicacion_origen asignada
    const itemsSinUbicacion = pedidoToApprove.items.filter(item => !almacenUbicaciones[item.id]);
    if (itemsSinUbicacion.length > 0) {
      setErr("Debes asignar una sub-ubicación del almacén para todos los productos");
      return;
    }
    
    // Elegir cualquier almacén disponible (asumimos que es el mismo para todos)
    const primerAlmacen = almacenesDisponibles[0];
    if (!primerAlmacen) {
      setErr("No se encontró el almacén");
      return;
    }
    
    setBusy(true);
    setErr(null);
    setShowAprobarAlmacenModal(false);
    try {
      const items = pedidoToApprove.items.map(item => ({
        id: item.id,
        sub_ubicacion_origen: almacenUbicaciones[item.id]
      }));
      
      await aprobarPedido(pedidoToApprove.id, {
        origen_tipo: 'sucursal',
        origen_sucursal: primerAlmacen.id,
        items
      });
      
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error aprobando pedido");
      setShowAprobarAlmacenModal(true);
    } finally {
      setBusy(false);
      setPedidoToApprove(null);
      setAlmacenUbicaciones({});
    }
  }

  async function confirmAprobarDesdeSucursal() {
    if (!pedidoToApprove || !sucursalOrigenSeleccionada) return;
    
    // Validar que todos los items tengan sub_ubicacion_origen asignada
    const itemsSinUbicacion = pedidoToApprove.items.filter(item => !sucursalUbicaciones[item.id]);
    if (itemsSinUbicacion.length > 0) {
      setErr("Debes asignar una sub-ubicación de origen para todos los productos");
      return;
    }
    
    setBusy(true);
    setErr(null);
    setShowAprobarSucursalModal(false);
    try {
      const items = pedidoToApprove.items.map(item => ({
        id: item.id,
        sub_ubicacion_origen: sucursalUbicaciones[item.id]
      }));
      
      await aprobarPedido(pedidoToApprove.id, {
        origen_tipo: 'sucursal',
        origen_sucursal: sucursalOrigenSeleccionada,
        items
      });
      
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error aprobando pedido");
      setShowAprobarSucursalModal(true);
    } finally {
      setBusy(false);
      setPedidoToApprove(null);
      setSucursalUbicaciones({});
      setSucursalOrigenSeleccionada(null);
    }
  }

  function onRechazar(id: number) {
    setPedidoAction(id);
    setShowRechazarConfirm(true);
  }

  async function confirmRechazar() {
    if (!pedidoAction) return;
    
    setBusy(true);
    setErr(null);
    setShowRechazarConfirm(false);
    try {
      await rechazarPedido(pedidoAction);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error rechazando pedido");
    } finally {
      setBusy(false);
      setPedidoAction(null);
    }
  }

  async function openReceiveModal(pedido: Pedido) {
    setErr(null);
    try {
      // Cargar sub-ubicaciones del destino del pedido (funciona tanto para sucursales como para almacén)
      const sucursalesData = await listSucursales();
      const destino = sucursalesData.find((s) => s.id === pedido.destino);
      if (destino && destino.sub_ubicaciones) {
        setSubUbicaciones(destino.sub_ubicaciones);
      }

      // Cargar pedido completo
      const pedidoCompleto = await getPedido(pedido.id);
      setPedidoToReceive(pedidoCompleto);

      // Precargar destinos si ya vienen seteados
      const preset: Record<number, number> = {};
      for (const it of pedidoCompleto.items ?? []) {
        if (it.sub_ubicacion_destino != null) preset[it.id] = it.sub_ubicacion_destino;
      }
      setDestinos(preset);

      setShowReceiveModal(true);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos para recibir pedido");
    }
  }

  async function onConfirmarRecepcion() {
    if (!pedidoToReceive) return;

    setReceiveBusy(true);
    setErr(null);
    try {
      const body = {
        items: pedidoToReceive.items.map((it) => ({
          id: it.id,
          sub_ubicacion_destino: destinos[it.id] ?? it.sub_ubicacion_destino ?? 0,
        })),
      };

      // Validación: todos con destino
      if (body.items.some((x) => !x.sub_ubicacion_destino || x.sub_ubicacion_destino <= 0)) {
        setErr("Asigná sub-ubicación destino a todos los productos.");
        setReceiveBusy(false);
        return;
      }

      await recibirPedido(pedidoToReceive.id, body);
      setShowReceiveModal(false);
      setPedidoToReceive(null);
      setDestinos({});
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error confirmando recepción");
    } finally {
      setReceiveBusy(false);
    }
  }

  // Orden personalizado según el rol
  // Admin: pendiente primero (para aprobar), luego el resto
  // Sucursal: aprobado primero (para recibir), luego el resto
  const ordenEstados = isAdmin 
    ? (["pendiente", "borrador", "aprobado", "recibido", "rechazado"] as const)
    : (["aprobado", "borrador", "pendiente", "recibido", "rechazado"] as const);
  
  const pedidosPorEstado = {
    aprobado: pedidos.filter(p => p.estado === "aprobado").sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    ),
    borrador: pedidos.filter(p => p.estado === "borrador"),
    pendiente: pedidos.filter(p => p.estado === "pendiente"),
    recibido: pedidos.filter(p => p.estado === "recibido").sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    ),
    rechazado: pedidos.filter(p => p.estado === "rechazado").sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    )
  };

  // Aplicar filtros si está en vista completa
  const aplicarFiltros = (pedidosLista: Pedido[]) => {
    let filtered = pedidosLista;
    
    if (filtroFechaDesde) {
      filtered = filtered.filter(p => new Date(p.fecha_creacion) >= new Date(filtroFechaDesde));
    }
    
    if (filtroFechaHasta) {
      filtered = filtered.filter(p => new Date(p.fecha_creacion) <= new Date(filtroFechaHasta));
    }
    
    if (filtroProducto) {
      filtered = filtered.filter(p => p.items.some(item => item.producto === filtroProducto));
    }
    
    if (filtroEstado) {
      filtered = filtered.filter(p => p.estado === filtroEstado);
    }
    
    if (filtroSucursal) {
      filtered = filtered.filter(p => p.destino === filtroSucursal);
    }
    
    if (filtroOrigenTipo) {
      filtered = filtered.filter(p => p.origen_tipo === filtroOrigenTipo);
    }
    
    return filtered;
  };

  // En modo compacto (vista por defecto)
  const pedidosMostrar = !vistaCompleta ? {
    aprobado: isAdmin ? pedidosPorEstado.aprobado.slice(0, 6) : pedidosPorEstado.aprobado,
    borrador: pedidosPorEstado.borrador,
    pendiente: pedidosPorEstado.pendiente,
    recibido: pedidosPorEstado.recibido.slice(0, 6), // últimos 6
    rechazado: pedidosPorEstado.rechazado.slice(0, 6) // últimos 6
  } : {
    aprobado: aplicarFiltros(pedidosPorEstado.aprobado),
    borrador: aplicarFiltros(pedidosPorEstado.borrador),
    pendiente: aplicarFiltros(pedidosPorEstado.pendiente),
    recibido: aplicarFiltros(pedidosPorEstado.recibido),
    rechazado: aplicarFiltros(pedidosPorEstado.rechazado)
  };

  const estadoLabels: Record<string, string> = {
    borrador: "Borrador",
    pendiente: "Pendiente",
    aprobado: "Aprobado",
    recibido: "Recibido",
    rechazado: "Rechazado"
  };

  const estadoBadgeVariant: Record<string, "draft" | "pending" | "approved" | "received" | "cancelled"> = {
    borrador: "draft",
    pendiente: "pending",
    aprobado: "approved",
    recibido: "received",
    rechazado: "cancelled"
  };

  if (loading) {
    return <PageLoader message="Cargando pedidos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Pedidos</h1>
          <p className="text-sm text-neutral-500 mt-1">Gestión de pedidos de mercadería</p>
        </div>
        
        {/* Toggle vista completa */}
        <Button 
          variant={vistaCompleta ? "primary" : "ghost"}
          onClick={() => {
            setVistaCompleta(!vistaCompleta);
            if (vistaCompleta) {
              // Resetear filtros al volver a vista compacta
              setFiltroFechaDesde("");
              setFiltroFechaHasta("");
              setFiltroProducto(null);
              setFiltroEstado("");
              setFiltroSucursal(null);
              setFiltroOrigenTipo("");
            }
          }}
        >
          {vistaCompleta ? (
            <>
              <List className="h-4 w-4" />
              Vista compacta
            </>
          ) : (
            <>
              <Filter className="h-4 w-4" />
              Ver todos los pedidos
            </>
          )}
        </Button>
      </div>

      {/* Panel de filtros (en vista completa) */}
      {vistaCompleta && (
        <Card>
          <CardBody>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                >
                  <option value="">Todos los estados</option>
                  <option value="borrador">Borrador</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="recibido">Recibido</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              
              {isAdmin && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Sucursal destino
                    </label>
                    <select
                      value={filtroSucursal?.toString() ?? ""}
                      onChange={(e) => setFiltroSucursal(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                    >
                      <option value="">Todas las sucursales</option>
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.tipo})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Origen
                    </label>
                    <select
                      value={filtroOrigenTipo}
                      onChange={(e) => setFiltroOrigenTipo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                    >
                      <option value="">Todos los orígenes</option>
                      <option value="distribuidor">Proveedor/Distribuidor</option>
                      <option value="sucursal">Sucursal/Almacén</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Producto
                </label>
                <select
                  value={filtroProducto?.toString() ?? ""}
                  onChange={(e) => setFiltroProducto(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                >
                  <option value="">Todos los productos</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {(filtroFechaDesde || filtroFechaHasta || filtroProducto || filtroEstado || filtroSucursal || filtroOrigenTipo) && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroFechaDesde("");
                    setFiltroFechaHasta("");
                    setFiltroProducto(null);
                    setFiltroEstado("");
                    setFiltroSucursal(null);
                    setFiltroOrigenTipo("");
                  }}
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Alert de errores */}
      {err && <Alert variant="error">{err}</Alert>}

      {/* Botón crear nuevo pedido */}
      {!showCreate && (
        <Button onClick={() => setShowCreate(true)} size="lg">
          <Plus className="h-5 w-5" />
          Crear nuevo pedido
        </Button>
      )}

      {/* Formulario crear pedido */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo pedido</CardTitle>
            <CardDescription>Completá los datos para crear un nuevo pedido de mercadería</CardDescription>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Destino */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Destino <span className="text-red-500">*</span>
              </label>
              {!isAdmin ? (
                <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="font-medium text-neutral-900">
                      {sucursales.find(s => s.id === destino)?.nombre || "Cargando..."}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {sucursales.find(s => s.id === destino)?.tipo || ""}
                    </div>
                  </div>
                </div>
              ) : (
                <select 
                  value={destino?.toString() ?? ""} 
                  onChange={(e) => setDestino(Number(e.target.value))}
                  className={clsx(
                    'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all',
                    'bg-white text-neutral-900',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    !destino
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-neutral-300 hover:border-neutral-400'
                  )}
                >
                  <option value="">Seleccionar sucursal...</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.tipo})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Origen (solo admin) */}
            {isAdmin && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Origen del pedido
                  </label>
                  <select 
                    value={origenTipoCreate} 
                    onChange={(e) => {
                      setOrigenTipoCreate(e.target.value as 'distribuidor' | 'sucursal');
                      setOrigenSucursalCreate(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                  >
                    <option value="distribuidor">Distribuidor / Proveedor externo</option>
                    <option value="sucursal">Otra sucursal / Almacén</option>
                  </select>
                </div>

                {origenTipoCreate === 'sucursal' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Sucursal origen
                    </label>
                    <select 
                      value={origenSucursalCreate?.toString() ?? ""} 
                      onChange={(e) => setOrigenSucursalCreate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                    >
                      <option value="">Seleccionar sucursal origen...</option>
                      {sucursales.filter(s => s.id !== destino).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.tipo})
                        </option>
                      ))}
                    </select>
                    {!origenSucursalCreate && (
                      <p className="text-xs text-amber-600">
                        Nota: La asignación de sub-ubicaciones se hará al aprobar el pedido
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Productos */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">
                Productos <span className="text-red-500">*</span>
              </label>
              
              {items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg">
                  <Package className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No hay productos agregados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const producto = productos.find(p => p.id === item.producto);
                    return (
                      <div 
                        key={index} 
                        className="flex gap-3 p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                      >
                        <div className="flex-1 space-y-3">
                          <select
                            value={item.producto || ""} 
                            onChange={(e) => {
                              const prodId = Number(e.target.value);
                              const prod = productos.find(p => p.id === prodId);
                              const newItems = [...items];
                              newItems[index] = {
                                ...newItems[index],
                                producto: prodId,
                                precio_costo_momento: prod ? prod.costo_compra.toString() : newItems[index].precio_costo_momento
                              };
                              setItems(newItems);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} - {p.categoria_nombre || "Sin categoría"} - ${p.costo_compra}
                              </option>
                            ))}
                          </select>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Cantidad</label>
                              <Input
                                type="number" 
                                placeholder="Cantidad" 
                                value={item.cantidad}
                                onChange={(e) => updateItem(index, "cantidad", Number(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Costo unitario</label>
                              <Input
                                type="number" 
                                value={item.precio_costo_momento}
                                readOnly
                                disabled
                                className="bg-neutral-50"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => removeItem(index)}
                          className="self-start"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={addItem} 
                disabled={productos.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
                Agregar producto
              </Button>
            </div>
          </CardBody>
          <CardFooter className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={onCreate} disabled={busy || !destino || items.length === 0} loading={busy}>
              Crear pedido
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Formulario editar pedido */}
      {showEdit && pedidoToEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Editar pedido #{pedidoToEdit.id}</CardTitle>
            <CardDescription>Modificá los productos del pedido en borrador</CardDescription>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Destino */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Destino <span className="text-red-500">*</span>
              </label>
              {!isAdmin ? (
                <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="font-medium text-neutral-900">
                      {sucursales.find(s => s.id === destino)?.nombre || "Cargando..."}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {sucursales.find(s => s.id === destino)?.tipo || ""}
                    </div>
                  </div>
                </div>
              ) : (
                <select 
                  value={destino?.toString() ?? ""} 
                  onChange={(e) => setDestino(Number(e.target.value))}
                  className={clsx(
                    'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all',
                    'bg-white text-neutral-900',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    !destino
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-neutral-300 hover:border-neutral-400'
                  )}
                >
                  <option value="">Seleccionar sucursal...</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.tipo})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Productos */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">
                Productos <span className="text-red-500">*</span>
              </label>
              
              {items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg">
                  <Package className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No hay productos agregados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const producto = productos.find(p => p.id === item.producto);
                    return (
                      <div 
                        key={index} 
                        className="flex gap-3 p-4 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                      >
                        <div className="flex-1 space-y-3">
                          <select
                            value={item.producto || ""} 
                            onChange={(e) => {
                              const prodId = Number(e.target.value);
                              const prod = productos.find(p => p.id === prodId);
                              const newItems = [...items];
                              newItems[index] = {
                                ...newItems[index],
                                producto: prodId,
                                precio_costo_momento: prod ? prod.costo_compra.toString() : newItems[index].precio_costo_momento
                              };
                              setItems(newItems);
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                          >
                            <option value="">Seleccionar producto...</option>
                            {productos.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} - {p.categoria_nombre || "Sin categoría"} - ${p.costo_compra}
                              </option>
                            ))}
                          </select>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Cantidad</label>
                              <Input
                                type="number" 
                                placeholder="Cantidad" 
                                value={item.cantidad}
                                onChange={(e) => updateItem(index, "cantidad", Number(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Costo unitario</label>
                              <Input
                                type="number" 
                                value={item.precio_costo_momento}
                                readOnly
                                disabled
                                className="bg-neutral-50"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => removeItem(index)}
                          className="self-start"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={addItem} 
                disabled={productos.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
                Agregar producto
              </Button>
            </div>
          </CardBody>
          <CardFooter className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => {
              setShowEdit(false);
              setPedidoToEdit(null);
              setItems([]);
              setDestino(isAdmin ? null : session?.sucursal ?? null);
            }} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={onUpdate} disabled={busy || !destino || items.length === 0} loading={busy}>
              Actualizar pedido
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Listado por estados - orden personalizado */}
      {ordenEstados.map(estado => {
        const pedidosEstado = pedidosMostrar[estado];
        if (pedidosEstado.length === 0) return null;
        
        // Calcular cuántos quedan sin mostrar en vista compacta
        const totalEstado = pedidosPorEstado[estado].length;
        const mostrandoEstado = pedidosEstado.length;
        const ocultosEstado = totalEstado - mostrandoEstado;
        
        const estaColapsada = seccionesColapsadas.has(estado);
        
        return (
          <div key={estado} className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSeccionesColapsadas(prev => {
                    const next = new Set(prev);
                    if (next.has(estado)) {
                      next.delete(estado);
                    } else {
                      next.add(estado);
                    }
                    return next;
                  });
                }}
                className="flex items-center gap-3 hover:opacity-70 transition-opacity"
              >
                {estaColapsada ? (
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-neutral-400" />
                )}
                <h2 className="text-lg font-semibold text-neutral-900">
                  {estadoLabels[estado as keyof typeof estadoLabels]}
                </h2>
                <Badge variant={estadoBadgeVariant[estado as keyof typeof estadoBadgeVariant]} dot>
                  {totalEstado}
                </Badge>
              </button>
              
              {ocultosEstado > 0 && !vistaCompleta && (
                <button
                  onClick={() => setVistaCompleta(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                >
                  (mostrando {mostrandoEstado} de {totalEstado})
                </button>
              )}
            </div>
            
            {!estaColapsada && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pedidosEstado.map((pedido) => (
                <Card key={pedido.id} className="hover:shadow-soft-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">Pedido #{pedido.id}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {pedido.destino_nombre}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {(pedido.estado === 'aprobado' || pedido.estado === 'recibido') && (
                          <button
                            onClick={() => handleDescargarPDF(pedido)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                            title="Descargar PDF"
                          >
                            <FileDown className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                          </button>
                        )}
                        <Badge variant={estadoBadgeVariant[pedido.estado as keyof typeof estadoBadgeVariant]}>
                          {estadoLabels[pedido.estado as keyof typeof estadoLabels]}
                        </Badge>
                        {pedido.origen_tipo && (pedido.estado === 'aprobado' || pedido.estado === 'recibido') && (
                          <Badge 
                            variant={pedido.origen_tipo === 'distribuidor' ? 'info' : 'pending'} 
                            title={pedido.origen_tipo === 'distribuidor' ? 'Provisto por proveedor externo' : `Provisto desde ${pedido.origen_sucursal_nombre}`}
                          >
                            {pedido.origen_tipo === 'distribuidor' ? 'Proveedor' : pedido.origen_sucursal_nombre}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(pedido.fecha_creacion).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-neutral-700">Productos:</div>
                      <div className="space-y-1.5">
                        {(expandedPedidos.has(pedido.id) ? pedido.items : pedido.items.slice(0, 2)).map(item => (
                          <div key={item.id} className="flex justify-between text-xs text-neutral-600 bg-neutral-50 px-2 py-1.5 rounded">
                            <span className="truncate">{item.producto_nombre}</span>
                            <span className="font-medium whitespace-nowrap ml-2">
                              {item.cantidad} × ${item.precio_costo_momento}
                            </span>
                          </div>
                        ))}
                        {pedido.items.length > 2 && (
                          <button
                            onClick={() => {
                              setExpandedPedidos(prev => {
                                const next = new Set(prev);
                                if (next.has(pedido.id)) {
                                  next.delete(pedido.id);
                                } else {
                                  next.add(pedido.id);
                                }
                                return next;
                              });
                            }}
                            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 px-2 py-1 transition-colors"
                          >
                            {expandedPedidos.has(pedido.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                <span>Ver menos</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                <span>+{pedido.items.length - 2} más...</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t border-neutral-100 flex justify-between text-sm font-semibold">
                        <span>Total:</span>
                        <span className="text-primary-700">
                          ${pedido.items.reduce((sum, item) => 
                            sum + (item.cantidad * parseFloat(item.precio_costo_momento)), 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                  
                  {(pedido.estado === "borrador" || 
                    (pedido.estado === "pendiente" && isAdmin) || 
                    (pedido.estado === "aprobado" && (!isAdmin || isAlmacenDestino(pedido)))) && (
                    <CardFooter className="flex gap-2">
                      {pedido.estado === "borrador" && (
                        <>
                          <Button 
                            onClick={() => openEditModal(pedido)}
                            disabled={busy}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button 
                            onClick={() => onEnviarARevision(pedido.id)}
                            disabled={busy}
                            className="flex-1"
                            size="sm"
                          >
                            <Send className="h-4 w-4" />
                            Enviar a revisión
                          </Button>
                          <Button 
                            onClick={() => onCancelar(pedido.id)}
                            disabled={busy}
                            size="sm"
                            variant="danger"
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {pedido.estado === "pendiente" && isAdmin && (
                        <>
                          <Button 
                            onClick={() => onAprobar(pedido.id)}
                            disabled={busy}
                            className="flex-1"
                            size="sm"
                            variant="success"
                          >
                            <Check className="h-4 w-4" />
                            Aprobar
                          </Button>
                          <Button 
                            onClick={() => onRechazar(pedido.id)}
                            disabled={busy}
                            className="flex-1"
                            size="sm"
                            variant="danger"
                          >
                            <X className="h-4 w-4" />
                            Rechazar
                          </Button>
                        </>
                      )}
                      {pedido.estado === "aprobado" && (!isAdmin || isAlmacenDestino(pedido)) && (
                        <Button 
                          onClick={() => openReceiveModal(pedido)}
                          disabled={busy}
                          className="w-full"
                          size="sm"
                          variant="success"
                        >
                          <Package className="h-4 w-4" />
                          Recibir pedido
                        </Button>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
            )}
          </div>
        );
      })}

      {pedidos.length === 0 && !showCreate && (
        <Card>
          <CardBody className="text-center py-12">
            <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No hay pedidos registrados</p>
          </CardBody>
        </Card>
      )}

      {/* Mensaje cuando los filtros no devuelven resultados */}
      {pedidos.length > 0 && vistaCompleta && 
       Object.values(pedidosMostrar).every(arr => arr.length === 0) && (
        <Card>
          <CardBody className="text-center py-12">
            <Search className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-2">No se encontraron pedidos con los filtros aplicados</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroFechaDesde("");
                setFiltroFechaHasta("");
                setFiltroProducto(null);
                setFiltroEstado("");
                setFiltroSucursal(null);
                setFiltroOrigenTipo("");
              }}
            >
              Limpiar filtros
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Modal: Elegir origen del pedido (almacén vs sucursal vs externo) */}
      <Modal
        open={showAprobarOrigenModal}
        onClose={() => {
          setShowAprobarOrigenModal(false);
          setPedidoToApprove(null);
        }}
        title="Aprobar pedido"
        description={`¿Cómo se proveerá el Pedido #${pedidoToApprove?.id}?`}
        size="sm"
      >
        <div className="space-y-3 py-2">
          <button
            onClick={handleAprobarDesdeSucursal}
            disabled={busy}
            className="w-full flex items-start gap-4 p-4 border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left"
          >
            <div className="p-2 bg-amber-100 rounded-lg mt-0.5">
              <MapPin className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-amber-800">Desde otra sucursal</div>
              <div className="text-sm text-amber-600">Se descuenta stock de otra sucursal que tenga disponibilidad</div>
            </div>
          </button>

          <button
            onClick={handleAprobarExtern}
            disabled={busy}
            className="w-full flex items-start gap-4 p-4 border-2 border-primary-300 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors text-left"
          >
            <div className="p-2 bg-primary-100 rounded-lg mt-0.5">
              <Send className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-primary-800">Externo (distribuidor)</div>
              <div className="text-sm text-primary-600">No afecta el stock, el pedido se gestiona con el proveedor externo</div>
            </div>
          </button>
        </div>
      </Modal>

      {/* Modal: Seleccionar sub-ubicación de origen del almacén */}
      <Modal
        open={showAprobarAlmacenModal}
        onClose={() => {
          setShowAprobarAlmacenModal(false);
          setPedidoToApprove(null);
          setAlmacenUbicaciones({});
          setAlmacenesDisponibles([]);
          setAlmacenStock([]);
        }}
        title="Asignar origen desde almacén"
        description="Indicá desde qué sub-ubicación del almacén se tomará cada producto"
        size="lg"
      >
        {pedidoToApprove && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="text-sm font-medium text-emerald-800">
                Pedido #{pedidoToApprove.id} → {pedidoToApprove.destino_nombre}
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">
                Asigná una sub-ubicación del almacén para cada producto
              </div>
            </div>

            <div className="space-y-3">
              {pedidoToApprove.items.map((item) => {
                // Buscar stock disponible en cada sub-ubicación para este producto
                const stockPorSubUbicacion = Object.fromEntries(
                  almacenStock
                    .filter(s => s.producto === item.producto)
                    .map(s => [s.sub_ubicacion, s.cantidad])
                );
                const subUbicSelected = almacenUbicaciones[item.id];
                const stockDisponible = subUbicSelected ? (stockPorSubUbicacion[subUbicSelected] ?? 0) : null;
                const stockInsuficiente = stockDisponible !== null && stockDisponible < item.cantidad;

                return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-neutral-900">{item.producto_nombre}</div>
                    <div className="text-xs text-neutral-500">Cantidad pedida: {item.cantidad}</div>
                    {stockInsuficiente && (
                      <div className="text-xs text-red-600 font-medium mt-0.5">
                        ⚠️ Stock insuficiente (disponible: {stockDisponible})
                      </div>
                    )}
                    {stockDisponible !== null && !stockInsuficiente && (
                      <div className="text-xs text-emerald-600 font-medium mt-0.5">
                        ✓ Disponible: {stockDisponible} unidades
                      </div>
                    )}
                  </div>
                  <select
                    value={almacenUbicaciones[item.id] ?? ""}
                    onChange={(e) => setAlmacenUbicaciones(prev => ({
                      ...prev,
                      [item.id]: Number(e.target.value)
                    }))}
                    className={`px-3 py-2 rounded-xl border text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      stockInsuficiente ? 'border-red-400' : 'border-neutral-300'
                    }`}
                  >
                    <option value="">Sub-ubicación origen...</option>
                    {almacenesDisponibles.map(almacen => (
                      <optgroup key={almacen.id} label={almacen.nombre}>
                        {almacen.sub_ubicaciones.map(sub => {
                          const qty = stockPorSubUbicacion[sub.id] ?? 0;
                          return (
                            <option key={sub.id} value={sub.id}>
                              {sub.nombre} ({sub.tipo}) — stock: {qty}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>
              );})}
            </div>

            <ModalFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAprobarAlmacenModal(false);
                  setPedidoToApprove(null);
                  setAlmacenUbicaciones({});
                  setAlmacenesDisponibles([]);
                  setAlmacenStock([]);
                }}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={confirmAprobarDesdeAlmacen}
                disabled={busy || pedidoToApprove.items.some(item => {
                  if (!almacenUbicaciones[item.id]) return true;
                  const qty = almacenStock.find(
                    s => s.producto === item.producto && s.sub_ubicacion === almacenUbicaciones[item.id]
                  )?.cantidad ?? 0;
                  return qty < item.cantidad;
                })}
                loading={busy}
              >
                <Check className="h-4 w-4" />
                Aprobar y descontar almacén
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Modal: Seleccionar sucursal origen y sub-ubicaciones */}
      <Modal
        open={showAprobarSucursalModal}
        onClose={() => {
          setShowAprobarSucursalModal(false);
          setPedidoToApprove(null);
          setSucursalUbicaciones({});
          setSucursalOrigenSeleccionada(null);
          setDisponibilidadSucursales([]);
          setSucursalOrigenStock([]);
        }}
        title="Asignar origen desde sucursal"
        description="Elegí la sucursal origen y asigná las sub-ubicaciones para cada producto"
        size="lg"
      >
        {pedidoToApprove && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-800">
                Pedido #{pedidoToApprove.id} → {pedidoToApprove.destino_nombre}
              </div>
              <div className="text-xs text-amber-600 mt-0.5">
                Seleccioná una sucursal que tenga stock disponible
              </div>
            </div>

            {/* Selector de sucursal origen */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Sucursal origen
              </label>
              <select
                value={sucursalOrigenSeleccionada ?? ""}
                onChange={(e) => handleSucursalOrigenChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent border-neutral-300"
              >
                <option value="">Seleccionar sucursal...</option>
                {disponibilidadSucursales.map(disp => (
                  <option
                    key={disp.sucursal_id}
                    value={disp.sucursal_id}
                    disabled={!disp.puede_completar}
                  >
                    {disp.sucursal_nombre} {disp.puede_completar ? '✓' : '(stock insuficiente)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Si hay sucursal seleccionada, mostrar asignación por producto */}
            {sucursalOrigenSeleccionada && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-neutral-700">
                  Asignar sub-ubicación para cada producto
                </div>
                {pedidoToApprove.items.map((item) => {
                  const sucursalInfo = sucursales.find(s => s.id === sucursalOrigenSeleccionada);
                  const stockPorSubUbicacion = Object.fromEntries(
                    sucursalOrigenStock
                      .filter(s => s.producto === item.producto)
                      .map(s => [s.sub_ubicacion, s.cantidad])
                  );
                  const subUbicSelected = sucursalUbicaciones[item.id];
                  const stockDisponible = subUbicSelected ? (stockPorSubUbicacion[subUbicSelected] ?? 0) : null;
                  const stockInsuficiente = stockDisponible !== null && stockDisponible < item.cantidad;

                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-neutral-900">{item.producto_nombre}</div>
                        <div className="text-xs text-neutral-500">Cantidad pedida: {item.cantidad}</div>
                        {stockInsuficiente && (
                          <div className="text-xs text-red-600 font-medium mt-0.5">
                            ⚠️ Stock insuficiente (disponible: {stockDisponible})
                          </div>
                        )}
                        {stockDisponible !== null && !stockInsuficiente && (
                          <div className="text-xs text-emerald-600 font-medium mt-0.5">
                            ✓ Disponible: {stockDisponible} unidades
                          </div>
                        )}
                      </div>
                      <select
                        value={sucursalUbicaciones[item.id] ?? ""}
                        onChange={(e) => setSucursalUbicaciones(prev => ({
                          ...prev,
                          [item.id]: Number(e.target.value)
                        }))}
                        className={`px-3 py-2 rounded-xl border text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                          stockInsuficiente ? 'border-red-400' : 'border-neutral-300'
                        }`}
                      >
                        <option value="">Sub-ubicación...</option>
                        {sucursalInfo?.sub_ubicaciones.map(sub => {
                          const qty = stockPorSubUbicacion[sub.id] ?? 0;
                          return (
                            <option key={sub.id} value={sub.id}>
                              {sub.nombre} ({sub.tipo}) — stock: {qty}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            <ModalFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAprobarSucursalModal(false);
                  setPedidoToApprove(null);
                  setSucursalUbicaciones({});
                  setSucursalOrigenSeleccionada(null);
                  setDisponibilidadSucursales([]);
                  setSucursalOrigenStock([]);
                }}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={confirmAprobarDesdeSucursal}
                disabled={busy || !sucursalOrigenSeleccionada || pedidoToApprove.items.some(item => {
                  if (!sucursalUbicaciones[item.id]) return true;
                  const qty = sucursalOrigenStock.find(
                    s => s.producto === item.producto && s.sub_ubicacion === sucursalUbicaciones[item.id]
                  )?.cantidad ?? 0;
                  return qty < item.cantidad;
                })}
                loading={busy}
              >
                <Check className="h-4 w-4" />
                Aprobar y descontar sucursal
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Modal para recibir pedido */}
      <Modal 
        open={showReceiveModal} 
        onClose={() => {
          setShowReceiveModal(false);
          setPedidoToReceive(null);
          setDestinos({});
        }}
        title="Recibir pedido"
        description="Asigná sub-ubicación destino a cada producto del pedido"
        size="lg"
      >
        {pedidoToReceive && (
          <div className="space-y-4">
            {/* Info del pedido */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900">
                    Pedido #{pedidoToReceive.id}
                  </div>
                  <div className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3" />
                    {pedidoToReceive.destino_nombre}
                  </div>
                </div>
                <Badge variant="approved">
                  {pedidoToReceive.items.length} {pedidoToReceive.items.length === 1 ? 'producto' : 'productos'}
                </Badge>
              </div>
            </div>

            {/* Items del pedido */}
            <div className="space-y-3">
              {pedidoToReceive.items.map((item) => (
                <div 
                  key={item.id}
                  className="border border-neutral-200 rounded-lg p-4 space-y-3 hover:border-primary-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {item.producto_nombre}
                      </div>
                      <div className="text-sm text-neutral-500 mt-1">
                        Cantidad: <span className="font-medium">{item.cantidad}</span> · 
                        Costo: <span className="font-medium">${item.precio_costo_momento}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sub-ubicación destino <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={destinos[item.id] ?? item.sub_ubicacion_destino ?? ""}
                      onChange={(e) =>
                        setDestinos((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                      }
                      className={clsx(
                        'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all',
                        'bg-white text-neutral-900',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                        !destinos[item.id] && !item.sub_ubicacion_destino
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-neutral-300 hover:border-neutral-400'
                      )}
                    >
                      <option value="">Seleccionar sub-ubicación...</option>
                      {subUbicaciones.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.nombre} ({sub.tipo})
                        </option>
                      ))}
                    </select>
                    {!destinos[item.id] && !item.sub_ubicacion_destino && (
                      <p className="mt-1.5 text-xs text-red-600">Este campo es requerido</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pedidoToReceive.items.some((it) => !destinos[it.id] && it.sub_ubicacion_destino == null) && (
              <Alert variant="warning">
                Completá la sub-ubicación destino en todos los productos antes de confirmar.
              </Alert>
            )}
          </div>
        )}

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowReceiveModal(false);
              setPedidoToReceive(null);
              setDestinos({});
            }}
            disabled={receiveBusy}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirmarRecepcion}
            disabled={
              receiveBusy || 
              (pedidoToReceive?.items.some((it) => !destinos[it.id] && it.sub_ubicacion_destino == null) ?? false)
            }
            loading={receiveBusy}
            variant="success"
          >
            <Check className="h-4 w-4" />
            Confirmar recepción
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showEnviarConfirm}
        onClose={() => {
          setShowEnviarConfirm(false);
          setPedidoAction(null);
        }}
        onConfirm={confirmEnviarARevision}
        title="Enviar a revisión"
        message="¿Enviar este pedido a revisión del administrador?"
        confirmText="Enviar"
        variant="info"
        loading={busy}
      />

      <ConfirmDialog
        open={showRechazarConfirm}
        onClose={() => {
          setShowRechazarConfirm(false);
          setPedidoAction(null);
        }}
        onConfirm={confirmRechazar}
        title="Rechazar pedido"
        message="¿Rechazar este pedido? Esta acción no se puede deshacer."
        confirmText="Rechazar"
        variant="danger"
        loading={busy}
      />

      <ConfirmDialog
        open={showCancelarConfirm}
        onClose={() => {
          setShowCancelarConfirm(false);
          setPedidoAction(null);
        }}
        onConfirm={confirmCancelar}
        title="Cancelar pedido"
        message="¿Eliminar este pedido borrador? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
