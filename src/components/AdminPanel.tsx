import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

import { subscribeToProducts, deleteProduct } from "../services/product.service";
import { subscribeToConfig } from "../services/config.service";

import AdminLayout from "./AdminLayout";
import AdminProductsList from "./AdminProductsList";
import AdminBusinessConfig from "./AdminBusinessConfig";
import AdminAsesoresTab from "./AdminAsesoresTab";
import AdminOpinionsTab from "./AdminOpinionsTab";
import AdminCarouselManager from "./AdminCarouselManager";
import AdminAddProductTab from "./AdminAddProductTab";
import SimpleModal from "./SimpleModal";

import {
  Button,
  Tabs,
  Tab,
} from "react-bootstrap";

import { Product, Asesor, CarouselSlideAdmin, ThemeVars, StoreConfig } from "../types";
import { extractProductSpecs } from "../utils/specs-parser";
import { useAuth } from "../hooks/useAuth";

function AdminPanel() {
  const { role } = useAuth();

  // Navigation Section
  const [key, setKey] = useState<string>("productos");

  // Product Form States
  const [nombreProducto, setNombreProducto] = useState<string>("");
  const [marcaProducto, setMarcaProducto] = useState<string>("Xiaomi");
  const [categoriaProducto, setCategoriaProducto] = useState<string>("Celulares");
  const [esDestacado, setEsDestacado] = useState<boolean>(false);
  const [stockProducto, setStockProducto] = useState<string>("10");
  const [descripcionProducto, setDescripcionProducto] = useState<string>("");
  const [contadoProducto, setContadoProducto] = useState<string>("");
  const [cuotas6Producto, setCuotas6Producto] = useState<string>("");
  const [cuotas8Producto, setCuotas8Producto] = useState<string>("");
  const [imagenProducto, setImagenProducto] = useState<string>("");
  const [cuotaInicialProducto, setCuotaInicialProducto] = useState<string>("");
  const [specsAlmacenamiento, setSpecsAlmacenamiento] = useState<string>("");
  const [specsRam, setSpecsRam] = useState<string>("");
  const [specsCamara, setSpecsCamara] = useState<string>("");
  const [specsPantalla, setSpecsPantalla] = useState<string>("");
  const [specsBateria, setSpecsBateria] = useState<string>("");
  const [productos, setProductos] = useState<Product[]>([]);
  const [editandoProducto, setEditandoProducto] = useState<Product | null>(null);

  // Promo States
  const [promoActivo, setPromoActivo] = useState<boolean>(false);
  const [promoPrice, setPromoPrice] = useState<string>("");
  const [promoBadgeText, setPromoBadgeText] = useState<string>("PROMO");
  const [promoBadgeBg, setPromoBadgeBg] = useState<string>("#d81b60");
  const [promoHighlight, setPromoHighlight] = useState<string>("");

  // New Badge States
  const [nuevoActivo, setNuevoActivo] = useState<boolean>(false);
  const [nuevoBadgeText, setNuevoBadgeText] = useState<string>("NUEVO");
  const [nuevoBadgeBg, setNuevoBadgeBg] = useState<string>("#28a745");
  const [badgeMode, setBadgeMode] = useState<string>("promo");

  // 12 Months Financing States
  const [solo12Meses, setSolo12Meses] = useState<boolean>(false);
  const [cuotas12Producto, setCuotas12Producto] = useState<string>("");

  // Business Config States
  const [nombreNegocio, setNombreNegocio] = useState<string>("GIO TECH");
  const [telefonoNegocio, setTelefonoNegocio] = useState<string>("3223652569");
  const [whatsappNegocio, setWhatsappNegocio] = useState<string>("3223652569");
  const [emailNegocio, setEmailNegocio] = useState<string>("contacto@giotech.com");
  const [direccionNegocio, setDireccionNegocio] = useState<string>(
    "Cra. 32 #13 36, Puerto Asís, Putumayo"
  );
  const [mapsUrlNegocio, setMapsUrlNegocio] = useState<string>(
    "https://maps.google.com/?q=Cra.+32+%2313-36,+Puerto+As%C3%ADs,+Putumayo"
  );
  const [horariosNegocio, setHorariosNegocio] = useState<string>(
    "Lunes a Sábado: 8:00 AM - 7:00 PM"
  );
  const [logoNegocio, setLogoNegocio] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");

  // Theme Config States
  const [themeEnabled, setThemeEnabled] = useState<boolean>(false);
  const [themeStart, setThemeStart] = useState<string>("");
  const [themeEnd, setThemeEnd] = useState<string>("");
  const [themeVars, setThemeVars] = useState<ThemeVars>({
    "--theme-name": "standard",
    "--promo-badge-bg": "#C8102E",
    "--promo-badge-text": "#ffffff",
    "--promo-highlight": "rgba(200,16,46,.18)",
  });

  // Asesores States
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [emailAsesor, setEmailAsesor] = useState<string>("");
  const [passwordAsesor, setPasswordAsesor] = useState<string>("");
  const [nombreCompletoAsesor, setNombreCompletoAsesor] = useState<string>("");
  const [whatsappAsesor, setWhatsappAsesor] = useState<string>("");
  const [rolAsesor, setRolAsesor] = useState<string>("asesor");
  const [editandoAsesor, setEditandoAsesor] = useState<Asesor | null>(null);

  // Carousel States
  const [slides, setSlides] = useState<CarouselSlideAdmin[]>([]);
  const [urlImagenSlide, setUrlImagenSlide] = useState<string>("");
  const [tituloSlide, setTituloSlide] = useState<string>("");
  const [ordenSlide, setOrdenSlide] = useState<string>("");
  const [activoSlide, setActivoSlide] = useState<boolean>(true);
  const [editandoSlide, setEditandoSlide] = useState<CarouselSlideAdmin | null>(
    null
  );
  const [previewImagenSlide, setPreviewImagenSlide] = useState<string>("");

  // Alerts & Modal States
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string | null;
    name?: string;
  }>({ show: false, id: null });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const toTimeInput = (
    ts: Date | { seconds: number } | string | null | undefined
  ): string => {
    if (!ts) return "";
    const ms =
      ts && (ts as { seconds: number }).seconds
        ? (ts as { seconds: number }).seconds * 1000
        : Date.parse(ts as string);
    return isNaN(ms) ? "" : new Date(ms).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (role && role !== "admin" && (key === "negocio" || key === "asesores")) {
      setKey("productos");
    }
  }, [role, key]);

  useEffect(() => {
    const unsubProductos = subscribeToProducts((lista: Product[]) => {
      setProductos(lista);
    });

    const unsubConfig = subscribeToConfig(
      (data: StoreConfig) => {
        if (data.nombre) setNombreNegocio(data.nombre);
        if (data.telefono) setTelefonoNegocio(data.telefono);
        if (data.whatsappNumber) setWhatsappNegocio(data.whatsappNumber);
        if (data.email) setEmailNegocio(data.email);
        if (data.direccion) setDireccionNegocio(data.direccion);
        if (data.mapsUrl) setMapsUrlNegocio(data.mapsUrl);
        if (data.horarios) setHorariosNegocio(data.horarios);
        if (data.logo) setPreviewLogo(data.logo);

        const theme = data.theme || null;
        if (theme) {
          setThemeEnabled(Boolean(theme.enabled));
          setThemeStart(toTimeInput(theme.start));
          setThemeEnd(toTimeInput(theme.end));
          setThemeVars((curr) => ({ ...curr, ...(theme.vars || {}) }));
        } else {
          setThemeEnabled(false);
          setThemeStart("");
          setThemeEnd("");
          setThemeVars({
            "--theme-name": "standard",
            "--promo-badge-bg": "#C8102E",
            "--promo-badge-text": "#ffffff",
            "--promo-highlight": "rgba(200,16,46,.18)",
          });
        }
      }
    );

    let unsubAsesores = () => {};
    if (role === "admin") {
      unsubAsesores = onSnapshot(
        query(collection(db, "usuarios"), where("rol", "in", ["admin", "asesor"])),
        (snapshot) => {
          const listaAsesores: Asesor[] = snapshot.docs.map(
            (docSnap: QueryDocumentSnapshot<DocumentData>) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })
          ) as Asesor[];
          setAsesores(listaAsesores);
        },
        (snapshotError) => {
          console.error("Error al obtener asesores:", snapshotError);
        }
      );
    } else {
      setAsesores([]);
    }

    const unsubCarrusel = onSnapshot(
      collection(db, "carrusel"),
      (snapshot) => {
        const listaSlides: CarouselSlideAdmin[] = snapshot.docs.map(
          (docSnap: QueryDocumentSnapshot<DocumentData>) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })
        ) as CarouselSlideAdmin[];
        setSlides(listaSlides);
      }
    );

    return () => {
      unsubProductos();
      unsubConfig();
      unsubAsesores();
      unsubCarrusel();
    };
  }, [role]);

  const handleResetProductForm = () => {
    setEditandoProducto(null);
    setNombreProducto("");
    setMarcaProducto("Xiaomi");
    setCategoriaProducto("Celulares");
    setEsDestacado(false);
    setStockProducto("10");
    setDescripcionProducto("");
    setContadoProducto("");
    setCuotas6Producto("");
    setCuotas8Producto("");
    setImagenProducto("");
    setCuotaInicialProducto("");
    setSpecsAlmacenamiento("");
    setSpecsRam("");
    setSpecsCamara("");
    setSpecsPantalla("");
    setSpecsBateria("");
    setPromoActivo(false);
    setPromoPrice("");
    setPromoBadgeText("PROMO");
    setPromoBadgeBg("#d81b60");
    setPromoHighlight("");
    setNuevoActivo(false);
    setNuevoBadgeText("NUEVO");
    setNuevoBadgeBg("#28a745");
    setBadgeMode("promo");
    setSolo12Meses(false);
    setCuotas12Producto("");
  };

  const handleEditProducto = (producto: Product) => {
    setEditandoProducto(producto);
    setNombreProducto(producto.nombre || "");
    setMarcaProducto(producto.marca || "Xiaomi");
    setCategoriaProducto(producto.categoria || "Celulares");
    setEsDestacado(!!producto.esDestacado);
    setStockProducto(
      producto.stock !== undefined && producto.stock !== null
        ? String(producto.stock)
        : "10"
    );
    setDescripcionProducto(producto.descripcion || "");
    setContadoProducto(producto.contado?.toString() || "");
    setCuotas6Producto(producto.cuotas6?.toString() || "");
    setCuotas8Producto(producto.cuotas8?.toString() || "");
    setImagenProducto(producto.imagen || "");
    setCuotaInicialProducto(producto.cuotaInicial?.toString() || "");

    const s = extractProductSpecs(producto);
    setSpecsAlmacenamiento(s.almacenamiento?.toString() || "");
    setSpecsRam(s.ram?.toString() || "");
    setSpecsCamara(s.camara?.toString() || "");
    setSpecsPantalla(s.pantalla?.toString() || "");
    setSpecsBateria(s.bateria?.toString() || "");

    setPromoActivo(!!producto.promo);
    setPromoPrice(producto.promoPrice?.toString() ?? "");
    setPromoBadgeText(producto.promoBadgeText || "PROMO");
    setPromoBadgeBg(producto.promoBadgeBg || "#d81b60");
    setPromoHighlight(producto.promoHighlight || "");

    setNuevoActivo(!!producto.nuevo);
    setNuevoBadgeText(producto.nuevoBadgeText || "NUEVO");
    setNuevoBadgeBg(producto.nuevoBadgeBg || "#28a745");

    setBadgeMode(producto.badgeMode || "promo");
    setSolo12Meses(!!producto.solo12Meses);
    setCuotas12Producto(producto.cuotas12?.toString() || "");
  };

  const handleDeleteProducto = async (id: string) => {
    setError("");
    setSuccess("");
    setIsDeleting(true);
    try {
      await deleteProduct(id);
      setSuccess("¡Producto eliminado exitosamente del catálogo!");
      setDeleteConfirm({ show: false, id: null });
    } catch (err: unknown) {
      console.error("Error al eliminar producto:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al eliminar producto: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation for header
  const stats = {
    totalProductos: productos.length,
    productosEnStock: productos.filter(
      (p) => p.stock === undefined || p.stock === null || p.stock > 0
    ).length,
    promosActivas: productos.filter((p) => p.promo).length,
    totalSlides: slides.length,
    totalAsesores: asesores.length,
  };

  return (
    <AdminLayout
      currentSection={key}
      onSectionChange={(k) => {
        if ((k === "negocio" || k === "asesores" || k === "opiniones") && role !== "admin") {
          setKey("productos");
          return;
        }
        setKey(k);
        setError("");
        setSuccess("");
      }}
      stats={stats}
    >
      <div className="admin-workspace-container">
        {/* Toast / Notification Banner */}
        {error && (
          <div className="admin-alert-banner error mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
            <div className="flex-grow-1">{error}</div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
              aria-label="Cerrar notificación"
            />
          </div>
        )}

        {success && (
          <div className="admin-alert-banner success mb-4" role="alert">
            <i className="bi bi-check-circle-fill flex-shrink-0" />
            <div className="flex-grow-1">{success}</div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess("")}
              aria-label="Cerrar notificación"
            />
          </div>
        )}

        {/* Hidden React Bootstrap Tabs for State Sync */}
        <Tabs
          id="admin-panel-tabs"
          activeKey={key}
          onSelect={(k) => {
            const nextKey = k || "productos";
            if ((nextKey === "negocio" || nextKey === "asesores" || nextKey === "opiniones") && role !== "admin") {
              setKey("productos");
            } else {
              setKey(nextKey);
            }
          }}
          className="admin-tabs-hidden mb-3"
        >
          {/* TAB 1: PRODUCTOS */}
          <Tab eventKey="productos" title="Productos">
            <AdminProductsList
              productos={productos}
              onEdit={(producto) => {
                handleEditProducto(producto);
                setKey("agregar-producto");
              }}
              onDelete={(id) => {
                const prod = productos.find((p) => p.id === id);
                setDeleteConfirm({
                  show: true,
                  id,
                  name: prod?.nombre || "este producto",
                });
              }}
              onAddNew={() => {
                handleResetProductForm();
                setKey("agregar-producto");
              }}
            />
          </Tab>

          {/* TAB 2: AGREGAR / EDITAR PRODUCTO */}
          <Tab eventKey="agregar-producto" title="Agregar Producto">
            <AdminAddProductTab
              nombreProducto={nombreProducto}
              setNombreProducto={setNombreProducto}
              marcaProducto={marcaProducto}
              setMarcaProducto={setMarcaProducto}
              categoriaProducto={categoriaProducto}
              setCategoriaProducto={setCategoriaProducto}
              esDestacado={esDestacado}
              setEsDestacado={setEsDestacado}
              stockProducto={stockProducto}
              setStockProducto={setStockProducto}
              descripcionProducto={descripcionProducto}
              setDescripcionProducto={setDescripcionProducto}
              contadoProducto={contadoProducto}
              setContadoProducto={setContadoProducto}
              cuotas6Producto={cuotas6Producto}
              setCuotas6Producto={setCuotas6Producto}
              cuotas8Producto={cuotas8Producto}
              setCuotas8Producto={setCuotas8Producto}
              imagenProducto={imagenProducto}
              setImagenProducto={setImagenProducto}
              cuotaInicialProducto={cuotaInicialProducto}
              setCuotaInicialProducto={setCuotaInicialProducto}
              specsAlmacenamiento={specsAlmacenamiento}
              setSpecsAlmacenamiento={setSpecsAlmacenamiento}
              specsRam={specsRam}
              setSpecsRam={setSpecsRam}
              specsCamara={specsCamara}
              setSpecsCamara={setSpecsCamara}
              specsPantalla={specsPantalla}
              setSpecsPantalla={setSpecsPantalla}
              specsBateria={specsBateria}
              setSpecsBateria={setSpecsBateria}
              editandoProducto={editandoProducto}
              setEditandoProducto={setEditandoProducto}
              promoActivo={promoActivo}
              setPromoActivo={setPromoActivo}
              promoPrice={promoPrice}
              setPromoPrice={setPromoPrice}
              promoBadgeText={promoBadgeText}
              setPromoBadgeText={setPromoBadgeText}
              promoBadgeBg={promoBadgeBg}
              setPromoBadgeBg={setPromoBadgeBg}
              promoHighlight={promoHighlight}
              setPromoHighlight={setPromoHighlight}
              nuevoActivo={nuevoActivo}
              setNuevoActivo={setNuevoActivo}
              nuevoBadgeText={nuevoBadgeText}
              setNuevoBadgeText={setNuevoBadgeText}
              nuevoBadgeBg={nuevoBadgeBg}
              setNuevoBadgeBg={setNuevoBadgeBg}
              badgeMode={badgeMode}
              setBadgeMode={setBadgeMode}
              solo12Meses={solo12Meses}
              setSolo12Meses={setSolo12Meses}
              cuotas12Producto={cuotas12Producto}
              setCuotas12Producto={setCuotas12Producto}
              setError={setError}
              setSuccess={setSuccess}
              onCancel={() => {
                handleResetProductForm();
                setKey("productos");
              }}
            />
          </Tab>

          {/* TAB 3: CONFIGURACIÓN NEGOCIO (Admin Only) */}
          {role === "admin" && (
            <Tab eventKey="negocio" title="Configuración del Negocio">
              <AdminBusinessConfig
                nombreNegocio={nombreNegocio}
                setNombreNegocio={setNombreNegocio}
                telefonoNegocio={telefonoNegocio}
                setTelefonoNegocio={setTelefonoNegocio}
                whatsappNegocio={whatsappNegocio}
                setWhatsappNegocio={setWhatsappNegocio}
                emailNegocio={emailNegocio}
                setEmailNegocio={setEmailNegocio}
                direccionNegocio={direccionNegocio}
                setDireccionNegocio={setDireccionNegocio}
                mapsUrlNegocio={mapsUrlNegocio}
                setMapsUrlNegocio={setMapsUrlNegocio}
                horariosNegocio={horariosNegocio}
                setHorariosNegocio={setHorariosNegocio}
                logoNegocio={logoNegocio}
                setLogoNegocio={setLogoNegocio}
                previewLogo={previewLogo}
                setPreviewLogo={setPreviewLogo}
                themeEnabled={themeEnabled}
                setThemeEnabled={setThemeEnabled}
                themeStart={themeStart}
                setThemeStart={setThemeStart}
                themeEnd={themeEnd}
                setThemeEnd={setThemeEnd}
                themeVars={themeVars}
                setThemeVars={setThemeVars}
                setError={setError}
                setSuccess={setSuccess}
              />
            </Tab>
          )}

          {/* TAB 4: ASESORES (Admin Only) */}
          {role === "admin" && (
            <Tab eventKey="asesores" title="Gestionar Asesores">
              <AdminAsesoresTab
                asesores={asesores}
                editandoAsesor={editandoAsesor}
                setEditandoAsesor={setEditandoAsesor}
                emailAsesor={emailAsesor}
                setEmailAsesor={setEmailAsesor}
                passwordAsesor={passwordAsesor}
                setPasswordAsesor={setPasswordAsesor}
                nombreCompletoAsesor={nombreCompletoAsesor}
                setNombreCompletoAsesor={setNombreCompletoAsesor}
                whatsappAsesor={whatsappAsesor}
                setWhatsappAsesor={setWhatsappAsesor}
                rolAsesor={rolAsesor}
                setRolAsesor={setRolAsesor}
                setError={setError}
                setSuccess={setSuccess}
                setKey={setKey}
              />
            </Tab>
          )}

          {/* TAB 5: CARRUSEL HERO */}
          <Tab eventKey="carrusel" title="Carrusel Hero">
            <AdminCarouselManager
              slides={slides}
              urlImagenSlide={urlImagenSlide}
              setUrlImagenSlide={setUrlImagenSlide}
              tituloSlide={tituloSlide}
              setTituloSlide={setTituloSlide}
              ordenSlide={ordenSlide}
              setOrdenSlide={setOrdenSlide}
              activoSlide={activoSlide}
              setActivoSlide={setActivoSlide}
              editandoSlide={editandoSlide}
              setEditandoSlide={setEditandoSlide}
              previewImagenSlide={previewImagenSlide}
              setPreviewImagenSlide={setPreviewImagenSlide}
              setError={setError}
              setSuccess={setSuccess}
              setKey={setKey}
            />
          </Tab>

          {/* TAB 6: OPINIONES DE GOOGLE (Admin Only) */}
          {role === "admin" && (
            <Tab eventKey="opiniones" title="Opiniones">
              <AdminOpinionsTab setError={setError} setSuccess={setSuccess} />
            </Tab>
          )}
        </Tabs>

        {/* Safe 1-Step Delete Product Modal */}
        {deleteConfirm.show && (
          <SimpleModal
            onClose={() =>
              !isDeleting && setDeleteConfirm({ show: false, id: null })
            }
            title="Eliminar Producto del Catálogo"
            footer={
              <div className="d-flex gap-2 w-100 justify-content-end">
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    setDeleteConfirm({ show: false, id: null })
                  }
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  disabled={isDeleting}
                  onClick={() => {
                    if (deleteConfirm.id) {
                      handleDeleteProducto(deleteConfirm.id);
                    }
                  }}
                  className="d-inline-flex align-items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash3" />
                      <span>Confirmar Eliminación</span>
                    </>
                  )}
                </Button>
              </div>
            }
          >
            <div className="d-flex align-items-start gap-3 py-2">
              <div
                className="rounded-circle p-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ background: "rgba(200, 16, 46, 0.1)", color: "#C8102E" }}
              >
                <i className="bi bi-exclamation-triangle-fill fs-3" />
              </div>
              <div>
                <h5 className="fw-bold mb-1">
                  ¿Estás seguro de eliminar este producto?
                </h5>
                <p className="text-muted mb-0">
                  El producto <strong>{deleteConfirm.name}</strong> será retirado permanentemente de la base de datos de Firestore y no aparecerá más en la tienda.
                </p>
              </div>
            </div>
          </SimpleModal>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminPanel;
