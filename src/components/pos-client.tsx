"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency as formatCurrencyValue, notifyStoreUpdate, printSaleDocument, readCachedDocuments, readCachedSales, writeCachedDocuments, writeCachedProducts, writeCachedSales } from "@/lib/sale-sync";
import type { Product } from "@/lib/types";

type CartItem = {
  productId: string;
  name: string;
  price: number;
  unitType: "unidad" | "peso";
  quantity: number;
  total: number;
};

interface PosClientProps {
  initialProducts: Product[];
}

const formatCurrency = (value: number) => formatCurrencyValue(value);
const POS_SESSION_STARTED_AT_KEY = "verduleria-pos-session-started-at";

const normalizeSearchText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function PosClient({ initialProducts }: PosClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [status, setStatus] = useState("Venta lista para cargar");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [manualWeight, setManualWeight] = useState("");
  const [scaleStatus, setScaleStatus] = useState<"idle" | "connecting" | "connected" | "unsupported" | "error">("idle");
  const [scaleRawData, setScaleRawData] = useState("Sin datos recibidos todavía.");
  const [scaleLastWeight, setScaleLastWeight] = useState<string | null>(null);
  const scalePortRef = useRef<any>(null);
  const scaleReaderRef = useRef<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | null>(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showCashSummary, setShowCashSummary] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => {
    if (typeof window === "undefined") return new Date().toISOString();
    const storedStartedAt = window.sessionStorage.getItem(POS_SESSION_STARTED_AT_KEY);
    if (storedStartedAt) return storedStartedAt;
    const startedAt = new Date().toISOString();
    window.sessionStorage.setItem(POS_SESSION_STARTED_AT_KEY, startedAt);
    return startedAt;
  });
  const [sessionSales, setSessionSales] = useState<ReturnType<typeof readCachedSales>>([]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      if (cart.length > 0) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error sincronizando productos con Supabase:", error);
        return;
      }

      if (!data || !active) return;

      setProducts(
        data.map((product: any) => ({
          id: product.id,
          organizationId: product.organization_id ?? "demo",
          branchId: product.branch_id ?? "demo",
          name: product.name,
          sku: product.sku ?? "",
          barcode: product.barcode ?? "",
          category: product.category ?? "Sin categoría",
          price: Number(product.price ?? 0),
          cost: Number(product.cost ?? 0),
          stock: Number(product.stock ?? 0),
          minStock: Number(product.min_stock ?? 0),
          unitType: (product.unit_type as "unidad" | "peso") ?? "peso",
          active: Boolean(product.active),
          createdAt: product.created_at ?? new Date().toISOString(),
        }))
      );
    };

    void loadProducts();

    const channel = supabase
      .channel("pos-products-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          void loadProducts();
        }
      )
      .subscribe();

    const fallbackRefresh = window.setInterval(() => {
      void loadProducts();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(fallbackRefresh);
      void supabase.removeChannel(channel);
    };
  }, [cart.length]);

  useEffect(() => {
    writeCachedProducts(products);
    notifyStoreUpdate("products");
  }, [products]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.total, 0),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    const search = normalizeSearchText(productSearch.trim());
    if (!search) return products;
    return products.filter((product) => normalizeSearchText(product.name).includes(search));
  }, [products, productSearch]);

  const openCashSummary = () => {
    const startedAt = new Date(sessionStartedAt).getTime();
    setSessionSales(readCachedSales().filter((sale) => new Date(sale.createdAt).getTime() >= startedAt));
    const nextSessionStartedAt = new Date().toISOString();
    window.sessionStorage.setItem(POS_SESSION_STARTED_AT_KEY, nextSessionStartedAt);
    setSessionStartedAt(nextSessionStartedAt);
    setShowCashSummary(true);
  };

  const sessionSalesTotal = useMemo(
    () => sessionSales.reduce((sum, sale) => sum + sale.total, 0),
    [sessionSales]
  );

  const sessionProductTotals = useMemo(() => {
    const productsById = new Map<string, { name: string; unitType: CartItem["unitType"]; quantity: number }>();

    sessionSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = productsById.get(item.productId);
        productsById.set(item.productId, {
          name: item.name,
          unitType: item.unitType,
          quantity: (current?.quantity ?? 0) + item.quantity,
        });
      });
    });

    return [...productsById.values()].sort((first, second) => first.name.localeCompare(second.name));
  }, [sessionSales]);

  const addToCart = (product: Product) => {
    const quantityValue = Number(manualWeight);
    const quantityStep = quantityValue;

    if (false) {
      setStatus("Caja cerrada. Abrí la caja antes de vender.");
      return;
    }

    if (Number.isNaN(quantityStep) || quantityStep <= 0) {
      setStatus("Ingresá una cantidad válida");
      return;
    }

    if (product.stock < quantityStep) {
      setStatus(`No hay suficiente stock de ${product.name}`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantityStep,
                total: (item.quantity + quantityStep) * item.price,
              }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          unitType: product.unitType,
          quantity: quantityStep,
          total: product.price * quantityStep,
        },
      ];
    });

    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, stock: item.stock - quantityStep } : item))
    );

    setStatus(`${product.name} agregado con ${product.unitType === "peso" ? quantityStep.toFixed(3) : quantityStep} ${product.unitType === "peso" ? "kg" : "u"}`);
    setSelectedProductId(product.id);
  };

  const openWeightModal = (product: Product) => {
    setSelectedProductId(product.id);
    setManualWeight("");
  };

  const closeWeightModal = () => {
    setSelectedProductId(null);
    setManualWeight("");
  };

  const connectScale = async () => {
    const serial = (navigator as Navigator & { serial?: { requestPort: () => Promise<any> } }).serial;
    if (!serial) {
      setScaleStatus("unsupported");
      return;
    }

    try {
      setScaleStatus("connecting");
      setScaleRawData("Abriendo puerto serial...");
      setScaleLastWeight(null);

      const port = await serial.requestPort();
      await port.open({ baudRate: 9600 });
      scalePortRef.current = port;
      setScaleStatus("connected");
      setScaleRawData("Puerto conectado a 9600 baudios. Esperando datos de la balanza...");

      const reader = port.readable?.getReader();
      if (!reader) {
        setScaleRawData("El puerto se abrió, pero no expone un flujo de lectura.");
        setScaleStatus("error");
        return;
      }

      scaleReaderRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const visible = buffer
          .replace(/\r/g, "\\r")
          .replace(/\n/g, "\\n")
          .replace(/\t/g, "\\t");

        setScaleRawData(visible.slice(-220));

        const weights = buffer.match(/-?\d+(?:[.,]\d+)?/g);
        if (weights?.length) {
          const weightText = weights.at(-1) ?? "";
          const weight = Number(weightText.replace(",", "."));

          if (Number.isFinite(weight) && weight >= 0) {
            const normalizedWeight = String(weight);
            setManualWeight(normalizedWeight);
            setScaleLastWeight(normalizedWeight);
          }
        }

        buffer = buffer.slice(-220);
      }

      setScaleRawData((current) =>
        current === "Puerto conectado a 9600 baudios. Esperando datos de la balanza..."
          ? "La conexión terminó sin recibir datos."
          : current
      );
    } catch (error) {
      console.error("Error de balanza:", error);
      setScaleRawData(error instanceof Error ? error.message : "Error desconocido al leer la balanza.");
      setScaleStatus("error");
    }
  };

  const disconnectScale = async () => {
    try {
      await scaleReaderRef.current?.cancel();
      scaleReaderRef.current?.releaseLock();
      await scalePortRef.current?.close();
    } finally {
      scaleReaderRef.current = null;
      scalePortRef.current = null;
      setScaleStatus("idle");
      setScaleRawData("Sin datos recibidos todavía.");
      setScaleLastWeight(null);
    }
  };

  const changeQuantity = (productId: string, delta: number) => {
    const product = products.find((entry) => entry.id === productId);
    if (delta > 0 && (!product || product.stock < delta)) {
      setStatus(`No hay suficiente stock de ${product?.name ?? "este producto"}`);
      return;
    }

    setCart((current) => {
      const item = current.find((entry) => entry.productId === productId);
      if (!item) return current;

      const nextQuantity = item.quantity + delta;
      if (nextQuantity <= 0) {
        return current.filter((entry) => entry.productId !== productId);
      }

      return current.map((entry) =>
        entry.productId === productId
          ? {
              ...entry,
              quantity: nextQuantity,
              total: nextQuantity * entry.price,
            }
          : entry
      );
    });

    setProducts((current) => {
      const product = current.find((entry) => entry.id === productId);
      if (!product) return current;

      const deltaStock = delta > 0 ? -delta : Math.abs(delta);
      return current.map((entry) =>
        entry.id === productId ? { ...entry, stock: entry.stock + deltaStock } : entry
      );
    });
  };

  const confirmSale = async () => {
    if (false) {
      setStatus("No se puede confirmar la venta con caja cerrada.");
      return;
    }

    if (cart.length === 0) {
      setStatus("El carrito está vacío");
      return;
    }

    setShowPaymentModal(true);
  };

  const processSale = async () => {
    if (!paymentMethod) {
      setStatus("Selecciona un medio de pago");
      return;
    }

    if (paymentMethod === "efectivo" && (!amountReceived || Number(amountReceived) < subtotal)) {
      setStatus("El monto recibido debe ser mayor o igual al total");
      return;
    }

    setStatus("Guardando venta...");

    const salePayload = {
      organization_id: "demo",
      branch_id: "main",
      customer_name: "Cliente presencial",
      total: subtotal,
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
    };

    const { error: saleError } = await supabase.from("sales").insert(salePayload);

    if (saleError) {
      setStatus("No se pudo guardar la venta.");
      return;
    }

    const updates = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return supabase.from("products").update({ stock: Number(product?.stock ?? 0) }).eq("id", item.productId);
    });

    await Promise.all(updates);

    const saleId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `sale-${Date.now()}`;
    const saleRecord = {
      id: saleId,
      createdAt: new Date().toISOString(),
      customerName: "Cliente presencial",
      paymentMethod: paymentMethod,
      total: subtotal,
      items: cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        unitType: item.unitType,
        quantity: item.quantity,
        total: item.total,
      })),
    };

    const nextSales = [saleRecord, ...readCachedSales()];
    writeCachedSales(nextSales);

    const nextDocuments = [
      {
        id: `${saleId}-ticket`,
        saleId,
        type: "ticket" as const,
        createdAt: new Date().toISOString(),
        customerName: "Cliente presencial",
        paymentMethod: "efectivo",
        subtotal,
        total: subtotal,
        items: saleRecord.items,
      },
      {
        id: `${saleId}-factura`,
        saleId,
        type: "factura" as const,
        createdAt: new Date().toISOString(),
        customerName: "Cliente presencial",
        paymentMethod: "efectivo",
        subtotal,
        total: subtotal,
        items: saleRecord.items,
      },
      ...readCachedDocuments(),
    ];
    writeCachedDocuments(nextDocuments);

    notifyStoreUpdate("sales");
    notifyStoreUpdate("documents");

    printSaleDocument(nextDocuments[0]);

    setStatus(`Venta confirmada: ${cart.map((item) => `${item.name} (${item.quantity}${item.unitType === "peso" ? " kg" : " u"})`).join(", ")}`);
    if (paymentMethod === "efectivo") {
      setStatus((prev) => `${prev}. Vuelto: ${formatCurrency(Number(amountReceived) - subtotal)}`);
    }
    setCart([]);
    setPaymentMethod(null);
    setAmountReceived("");
    setShowPaymentModal(false);
    closeWeightModal();
  };

  return (
    <>
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Punto de venta</p>
            <h3 className="text-2xl font-semibold">Venta</h3>
          </div>
        </div>
        <label className="mb-4 block">
          <span className="sr-only">Buscar producto por nombre</span>
          <input
            type="search"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder="Buscar producto por nombre..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredProducts.map((product) => {
            const isSelected = product.id === selectedProductId;
            const isOutOfStock = product.stock <= 0;
            const isLowStock = !isOutOfStock && product.minStock > 0 && product.stock <= product.minStock;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => openWeightModal(product)}
                disabled={isOutOfStock}
                className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isOutOfStock
                    ? "border-red-300 bg-red-50"
                    : isLowStock
                      ? "border-amber-300 bg-amber-50 hover:border-amber-500"
                      : isSelected
                        ? "border-slate-900 bg-slate-100"
                        : "border-slate-200 bg-white hover:border-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.category}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {formatCurrency(product.price)}/{product.unitType === "peso" ? "kg" : "u"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Stock: {product.stock.toFixed(1)} {product.unitType === "peso" ? "kg" : "u"}</p>
                {isOutOfStock ? (
                  <p className="mt-4 text-sm font-semibold text-red-700">Agotado: no disponible para vender</p>
                ) : isLowStock ? (
                  <p className="mt-4 text-sm font-semibold text-amber-700">Stock bajo: quedan pocas existencias</p>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">Toca para cargar {product.unitType === "peso" ? "el peso" : "la cantidad"}</p>
                )}
              </button>
            );
          })}
        </div>
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
            No se encontraron productos con ese nombre.
          </div>
        ) : null}
        {selectedProduct ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{selectedProduct.unitType === "peso" ? "Peso por producto" : "Cantidad por producto"}</p>
                  <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeWeightModal}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  Cerrar
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-500">Ingresa el peso o la cantidad antes de agregar al carrito. Más adelante podrás conectar una balanza para cargarlo automático.</p>
              {selectedProduct.unitType === "peso" ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Balanza conectada</p>
                      <p className="text-xs text-slate-500">Compatible con balanzas USB/serial que envían el peso como texto.</p>
                    </div>
                    {scaleStatus === "connected" ? (
                      <button type="button" onClick={disconnectScale} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">Desconectar</button>
                    ) : (
                      <button type="button" onClick={connectScale} disabled={scaleStatus === "connecting"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50">{scaleStatus === "connecting" ? "Conectando..." : "Conectar balanza"}</button>
                    )}
                  </div>
                  {scaleStatus === "connected" ? <p className="mt-2 text-xs text-emerald-700">Balanza conectada: el peso se actualizará automáticamente.</p> : null}
                  {scaleStatus === "unsupported" ? <p className="mt-2 text-xs text-amber-700">Este navegador no permite conectar balanzas. Usá Chrome o Edge de escritorio.</p> : null}
                  {scaleStatus === "error" ? <p className="mt-2 text-xs text-rose-700">No se pudo conectar o leer la balanza. Revisá el diagnóstico de abajo.</p> : null}

                  {(scaleStatus === "connected" || scaleStatus === "error") ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-700">Diagnóstico de balanza</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-600">{scaleRawData}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        Último peso detectado: <span className="font-semibold">{scaleLastWeight ?? "ninguno"}</span>
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="block text-sm text-slate-500">
                  {selectedProduct.unitType === "peso" ? "Peso (kg)" : "Cantidad"}
                  <input
                    type="number"
                    min={selectedProduct.unitType === "peso" ? "0.001" : "1"}
                    step={selectedProduct.unitType === "peso" ? "0.001" : "1"}
                    placeholder={selectedProduct.unitType === "peso" ? "Ej.: 0.750" : "Ej.: 3"}
                    value={manualWeight}
                    onChange={(event) => setManualWeight(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct);
                    closeWeightModal();
                  }}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showPaymentModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-4">
                <p className="text-sm text-slate-500">Medio de pago</p>
                <h2 className="text-xl font-semibold">Selecciona cómo paga el cliente</h2>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("efectivo")}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    paymentMethod === "efectivo" ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white hover:border-slate-900"
                  }`}
                >
                  <p className="font-semibold">Efectivo</p>
                  <p className="text-sm text-slate-500">Pago en efectivo</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("tarjeta")}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    paymentMethod === "tarjeta" ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white hover:border-slate-900"
                  }`}
                >
                  <p className="font-semibold">Tarjeta</p>
                  <p className="text-sm text-slate-500">Débito o crédito</p>
                </button>
              </div>

              {paymentMethod === "efectivo" && (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium">Monto recibido</label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(event) => setAmountReceived(event.target.value)}
                    placeholder={`Mínimo: ${formatCurrency(subtotal)}`}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm"
                  />
                  {amountReceived && Number(amountReceived) >= subtotal && (
                    <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
                      <p className="text-sm text-slate-600">Vuelto: <span className="font-semibold text-emerald-700">{formatCurrency(Number(amountReceived) - subtotal)}</span></p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentMethod(null);
                    setAmountReceived("");
                  }}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={processSale}
                  disabled={!paymentMethod || (paymentMethod === "efectivo" && !amountReceived)}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  Confirmar pago
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold">Carrito</h3>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Todavía no hay productos cargados.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span>{formatCurrency(item.total)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQuantity(item.productId, item.unitType === "peso" ? -0.5 : -1)}
                      className="rounded-full border border-slate-300 px-2 py-1"
                    >
                      −
                    </button>
                    <span>{item.unitType === "peso" ? item.quantity.toFixed(3) : item.quantity} {item.unitType === "peso" ? "kg" : "u"}</span>
                    <button
                      onClick={() => changeQuantity(item.productId, item.unitType === "peso" ? 0.5 : 1)}
                      className="rounded-full border border-slate-300 px-2 py-1"
                    >
                      +
                    </button>
                  </div>
                  <span>{item.unitType === "peso" ? "Precio por kilo" : "Precio unitario"}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
        <button
          onClick={confirmSale}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white"
        >
          Confirmar venta
        </button>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </div>
    </div>
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={openCashSummary}
        className="rounded-xl bg-red-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        CERRAR CAJA
      </button>
    </div>

    {showCashSummary ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Resumen de la sesión actual</p>
              <h2 className="text-xl font-semibold">Cierre de caja</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCashSummary(false)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ventas realizadas</p>
              <p className="mt-1 text-2xl font-semibold">{sessionSales.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total vendido</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(sessionSalesTotal)}</p>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-700">Productos vendidos</h3>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {sessionProductTotals.map((product) => (
                <div key={`${product.name}-${product.unitType}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span>{product.name}</span>
                  <span className="font-semibold">
                    {product.unitType === "peso" ? `${product.quantity.toFixed(3)} kg` : `${product.quantity} u`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 max-h-48 space-y-3 overflow-y-auto pr-1">
            {sessionSales.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Todavía no se registraron ventas en esta sesión.
              </p>
            ) : (
              sessionSales.map((sale) => (
                <div key={sale.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3 font-medium">
                    <span>{sale.paymentMethod === "efectivo" ? "Efectivo" : "Tarjeta"}</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {sale.items
                      .map((item) => `${item.name} (${item.unitType === "peso" ? `${item.quantity.toFixed(3)} kg` : `${item.quantity} u`})`)
                      .join(", ")}
                  </p>
                </div>
              ))
            )}
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">
            El contador de ventas se reinició para el próximo cierre de caja.
          </p>
        </div>
      </div>
    ) : null}
    </>
  );
}
