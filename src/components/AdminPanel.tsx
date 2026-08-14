import { useState, useEffect, FormEvent } from "react";
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
import AdminCarouselManager from "./AdminCarouselManager";
import AdminAddProductTab from "./AdminAddProductTab";
import SimpleModal from "./SimpleModal";

import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Table,
  Alert,
  Tabs,
  Tab,
  Badge,
} from "react-bootstrap";

import { Product, Asesor, CarouselSlideAdmin, ThemeVars } from "../types";

function AdminPanel() {
  const [nombreProducto, setNombreProducto] = useState<string>("");
  const [descripcionProducto, setDescripcionProducto] = useState<string>("");
  const [contadoProducto, setContadoProducto] = useState<string>("");
  const [cuotas6Producto, setCuotas6Producto] = useState<string>("");
  const [cuotas8Producto, setCuotas8Producto] = useState<string>("");
  const [imagenProducto, setImagenProducto] = useState<string>("");
  const [cuotaInicialProducto, setCuotaInicialProducto] = useState<string>("");
  const [productos, setProductos] = useState<Product[]>([]);
  const [editandoProducto, setEditandoProducto] = useState<Product | null>(null);


  const [promoActivo, setPromoActivo] = useState<boolean>(false);
  const [promoPrice, setPromoPrice] = useState<string>("");
  const [promoBadgeText, setPromoBadgeText] = useState<string>("PROMO");
  const [promoBadgeBg, setPromoBadgeBg] = useState<string>("#d81b60");
  const [promoHighlight, setPromoHighlight] = useState<string>("");

  const [nuevoActivo, setNuevoActivo] = useState<boolean>(false);
  const [nuevoBadgeText, setNuevoBadgeText] = useState<string>("NUEVO");
  const [nuevoBadgeBg, setNuevoBadgeBg] = useState<string>("#28a745");

  const [badgeMode, setBadgeMode] = useState<string>("promo");

  const [solo12Meses, setSolo12Meses] = useState<boolean>(false);
  const [cuotas12Producto, setCuotas12Producto] = useState<string>("");

  const [nombreNegocio, setNombreNegocio] = useState<string>("");
  const [logoNegocio, setLogoNegocio] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");

  const [themeEnabled, setThemeEnabled] = useState<boolean>(false);
  const [themeStart, setThemeStart] = useState<string>("");
  const [themeEnd, setThemeEnd] = useState<string>("");
  const [themeVars, setThemeVars] = useState<ThemeVars>({
    "--promo-badge-bg": "#d81b60",
    "--promo-badge-text": "#ffffff",
    "--promo-highlight": "rgba(216,27,96,.18)",
  });

  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [emailAsesor, setEmailAsesor] = useState<string>("");
  const [passwordAsesor, setPasswordAsesor] = useState<string>("");
  const [nombreCompletoAsesor, setNombreCompletoAsesor] = useState<string>("");
  const [whatsappAsesor, setWhatsappAsesor] = useState<string>("");
  const [rolAsesor, setRolAsesor] = useState<string>("asesor");
  const [editandoAsesor, setEditandoAsesor] = useState<Asesor | null>(null);

  const [slides, setSlides] = useState<CarouselSlideAdmin[]>([]);
  const [urlImagenSlide, setUrlImagenSlide] = useState<string>("");
  const [tituloSlide, setTituloSlide] = useState<string>("");
  const [ordenSlide, setOrdenSlide] = useState<string>("");
  const [activoSlide, setActivoSlide] = useState<boolean>(true);
  const [editandoSlide, setEditandoSlide] = useState<CarouselSlideAdmin | null>(null);
  const [previewImagenSlide, setPreviewImagenSlide] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [key, setKey] = useState<string>("productos");
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  const toTimeInput = (ts: Date | { seconds: number } | string | null | undefined): string => {
    if (!ts) return "";
    const ms = ts && (ts as { seconds: number }).seconds ? (ts as { seconds: number }).seconds * 1000 : Date.parse(ts as string);
    return isNaN(ms) ? "" : new Date(ms).toISOString().slice(0, 16);
  };

  useEffect(() => {
    const unsubProductos = subscribeToProducts((lista: Product[]) => {
      setProductos(lista);
    });

    const unsubConfig = subscribeToConfig((data: { nombre?: string; logo?: string; theme?: { enabled: boolean; start?: Date | null; end?: Date | null; vars: ThemeVars } | null }) => {
      setNombreNegocio(data.nombre || "");
      setPreviewLogo(data.logo || "");

      const theme = data.theme || null;
      if (theme) {
        setThemeEnabled(!!theme.enabled);
        setThemeStart(toTimeInput(theme.start));
        setThemeEnd(toTimeInput(theme.end));
        setThemeVars((curr) => ({ ...curr, ...(theme.vars || {}) }));
      }
    });

    const unsubAsesores = onSnapshot(
      query(collection(db, "usuarios"), where("rol", "in", ["admin", "asesor"])),
      (snapshot) => {
      const listaAsesores: Asesor[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      })) as Asesor[];
      setAsesores(listaAsesores);
    });

    const unsubCarrusel = onSnapshot(collection(db, "carrusel"), (snapshot) => {
      const listaSlides: CarouselSlideAdmin[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      })) as CarouselSlideAdmin[];
      setSlides(listaSlides);
    });

    return () => {
      unsubProductos();
      unsubConfig();
      unsubAsesores();
      unsubCarrusel();
    };
  }, []);

  const handleEditProducto = (producto: Product) => {
    setEditandoProducto(producto);
    setNombreProducto(producto.nombre);
    setDescripcionProducto(producto.descripcion || "");
    setContadoProducto(producto.contado?.toString() || "");
    setCuotas6Producto(producto.cuotas6?.toString() || "");
    setCuotas8Producto(producto.cuotas8?.toString() || "");
    setImagenProducto(producto.imagen || "");
    setCuotaInicialProducto(producto.cuotaInicial?.toString() || "");

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
    if (
      window.confirm("¿Estás seguro de que quieres eliminar este producto?")
    ) {
      try {
        await deleteProduct(id);
        setSuccess("Producto eliminado exitosamente!");
      } catch (err: unknown) {
        console.error("Error al eliminar producto:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar producto: ${message}`);
      }
    }
  };

  return (
    <AdminLayout currentSection={key} onSectionChange={setKey}>
      <Container className="py-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Tabs
            id="admin-panel-tabs"
            activeKey={key}
            onSelect={(k) => setKey(k || "productos")}
            className="admin-tabs-hidden mb-3"
          >
        <Tab eventKey="productos" title="Productos">
          <AdminProductsList 
            productos={productos}
            onEdit={(producto) => {
              handleEditProducto(producto);
              setKey("agregar-producto");
            }}
            onDelete={(id) => {
              setDeleteConfirm({ show: true, id });
            }}
          />
        </Tab>

        {deleteConfirm.show && (
          <SimpleModal 
            onClose={() => setDeleteConfirm({ show: false, id: null })}
            title="Eliminar Producto"
            footer={
              <>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setDeleteConfirm({ show: false, id: null })}
                  style={{ borderRadius: "8px" }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    if (deleteConfirm.id) {
                      handleDeleteProducto(deleteConfirm.id);
                    }
                    setDeleteConfirm({ show: false, id: null });
                  }}
                  style={{ borderRadius: "8px", background: "#C8102E", borderColor: "#C8102E" }}
                >
                  Eliminar
                </Button>
              </>
            }
          >
            <p style={{ margin: 0, fontSize: "1rem" }}>
              ¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.
            </p>
          </SimpleModal>
        )}

        <Tab eventKey="agregar-producto" title="Agregar Producto">
          <AdminAddProductTab
            nombreProducto={nombreProducto}
            setNombreProducto={setNombreProducto}
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
          />
        </Tab>

        <Tab eventKey="negocio" title="Configuración del Negocio">
          <AdminBusinessConfig
            nombreNegocio={nombreNegocio}
            setNombreNegocio={setNombreNegocio}
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
      </Tabs>
    </Container>
    </AdminLayout>
  );
}

export default AdminPanel;
