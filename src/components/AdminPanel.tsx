import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  subscribeToProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/product.service";
import { subscribeToConfig, updateConfig } from "../services/config.service";

import { getApp, getApps, initializeApp, deleteApp } from "firebase/app";
import { getAuth as getAuthSecondary } from "firebase/auth";

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
  InputGroup,
  Badge,
} from "react-bootstrap";

import { Product, ProductSpecs, Asesor, CarouselSlideAdmin, ThemeVars } from "../types";

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
  const [searchProducto, setSearchProducto] = useState<string>("");

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

  const storage = getStorage();

  function parseDescriptionToSpecs(description: string = ""): ProductSpecs {
    if (!description || typeof description !== "string") return {
      almacenamiento: null,
      ram: null,
      camara: null,
      pantalla: null,
      bateria: null,
    };
    const text = description.toLowerCase();

    const toNum = (v: string | number | undefined | null): number | null => {
      if (v === 0 || v) {
        const s = String(v)
          .replace(/[^0-9.,]/g, "")
          .replace(",", ".");
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const almacenamientoMatch = text.match(/\b(\d{2,4})\s?gb\b/);
    const almacenamiento = almacenamientoMatch
      ? toNum(almacenamientoMatch[1])
      : null;

    const ramMatch =
      text.match(/\b(\d{1,2})\s?gb\s?de\s?ram\b/) ||
      text.match(/\b(\d{1,2})\s?gb\s?ram\b/) ||
      text.match(/\b(\d{1,2})\s?gb\b/);
    const ram = ramMatch ? toNum(ramMatch[1]) : null;

    const camMatch =
      text.match(/(\d{2,4})\s?mp\b/) ||
      text.match(/cámara\s?de\s?(\d{2,4})\s?mp/);
    const camara = camMatch ? toNum(camMatch[1] || camMatch[2]) : null;

    const screenMatch =
      text.match(/(\d{1,2}(?:[.,]\d)?)\s?(?:pulgadas|")/) ||
      text.match(/pantalla.*?(\d{1,2}(?:[.,]\d)?)/);
    const pantalla = screenMatch
      ? toNum((screenMatch[1] || screenMatch[2] || "").replace(",", "."))
      : null;

    const batMatch = text.match(/(\d{3,5})\s?m(?:ah)?\b/);
    const bateria = batMatch ? toNum(batMatch[1]) : null;

    return {
      almacenamiento: almacenamiento || null,
      ram: ram || null,
      camara: camara || null,
      pantalla: pantalla || null,
      bateria: bateria || null,
    };
  }

  const toTimeInput = (ts: Date | { seconds: number } | string | null | undefined): string => {
    if (!ts) return "";
    const ms = ts && (ts as { seconds: number }).seconds ? (ts as { seconds: number }).seconds * 1000 : Date.parse(ts as string);
    return isNaN(ms) ? "" : new Date(ms).toISOString().slice(0, 16);
  };
  const toDateOrNull = (s: string): Date | null => (s ? new Date(s) : null);

  useEffect(() => {
    const unsubProductos = subscribeToProducts((lista: Product[]) => {
      setProductos(lista);
    });

    const unsubConfig = subscribeToConfig((data: { nombre?: string; logo?: string; theme?: { enabled: boolean; start?: Date; end?: Date; vars: ThemeVars } | null }) => {
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

    const unsubAsesores = onSnapshot(collection(db, "usuarios"), (snapshot) => {
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

  const resetProductoForm = () => {
    setNombreProducto("");
    setDescripcionProducto("");
    setContadoProducto("");
    setCuotas6Producto("");
    setCuotas8Producto("");
    setImagenProducto("");
    setCuotaInicialProducto("");

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

    setEditandoProducto(null);
  };

  const handleSubmitProducto = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const specs = parseDescriptionToSpecs(descripcionProducto || "");

    const parseNumberSafe = (v: string): number | null => {
      if (v === "" || v === null || typeof v === "undefined") return null;
      const s = String(v).replace(/\s+/g, "").replace(/,/, ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const contadoVal = parseNumberSafe(contadoProducto);
    const cuotas6Val = parseNumberSafe(cuotas6Producto);
    const cuotas8Val = parseNumberSafe(cuotas8Producto);
    const cuotaInicialVal = parseNumberSafe(cuotaInicialProducto);

    try {
      const payload: Partial<Product> = {
        nombre: nombreProducto,
        descripcion: descripcionProducto,
        contado: contadoVal,
        cuotas6: cuotas6Val,
        cuotas8: cuotas8Val,
        imagen: imagenProducto,
        cuotaInicial: cuotaInicialVal,
        specs: specs,
        promo: !!promoActivo,
        promoPrice: promoActivo ? Number(promoPrice || 0) : null,
        promoBadgeText: promoActivo ? promoBadgeText || "PROMO" : null,
        promoBadgeBg: promoActivo ? promoBadgeBg || null : null,
        promoHighlight: promoActivo ? promoHighlight || null : null,
        nuevo: !!nuevoActivo,
        nuevoBadgeText: nuevoActivo ? nuevoBadgeText || "NUEVO" : null,
        nuevoBadgeBg: nuevoActivo ? nuevoBadgeBg || null : null,
        badgeMode: (badgeMode || "promo") as 'none' | 'promo' | 'nuevo' | 'ambos',
        solo12Meses: !!solo12Meses,
        cuotas12: solo12Meses ? parseNumberSafe(cuotas12Producto) : null,
      };

      if (editandoProducto) {
        await updateProduct(editandoProducto.id, payload);
        setSuccess("Producto actualizado exitosamente!");
      } else {
        await createProduct(payload);
        setSuccess("Producto agregado exitosamente!");
      }
      resetProductoForm();
    } catch (err: unknown) {
      console.error("Error al guardar producto:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al guardar producto: ${message}`);
    }
  };

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

  const handleUpdateConfig = async () => {
    setError("");
    setSuccess("");
    try {
      let logoUrl = previewLogo;
      if (logoNegocio) {
        const logoRef = ref(storage, `config/logo_${Date.now()}`);
        await uploadBytes(logoRef, logoNegocio);
        logoUrl = await getDownloadURL(logoRef);
      }
      await updateConfig({
        nombre: nombreNegocio,
        logo: logoUrl,
        theme: {
          enabled: themeEnabled,
          start: toDateOrNull(themeStart),
          end: toDateOrNull(themeEnd),
          vars: themeVars,
        },
      });
      setSuccess("Configuración actualizada exitosamente!");
      setLogoNegocio(null);
    } catch (err: unknown) {
      console.error("Error al actualizar configuración:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al actualizar configuración: ${message}`);
    }
  };

  const handleAddAsesor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const primaryApp = getApp();
      const secondaryApp =
        getApps().find((a) => a.name === "Secondary") ||
        initializeApp(primaryApp.options, "Secondary");
      const secondaryAuth = getAuthSecondary(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        emailAsesor,
        passwordAsesor,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        email: emailAsesor,
        nombreCompleto: nombreCompletoAsesor,
        rol: rolAsesor,
        whatsappNumber: whatsappAsesor,
      });

      try {
        await secondaryAuth.signOut?.();
      } catch { /* ignore logout errors */ }
      try {
        await deleteApp(secondaryApp);
      } catch { /* ignore delete errors */ }

      setSuccess("Asesor registrado exitosamente!");
      setEmailAsesor("");
      setPasswordAsesor("");
      setNombreCompletoAsesor("");
      setWhatsappAsesor("");
    } catch (err: unknown) {
      console.error("Error al registrar asesor:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al registrar asesor: ${message}`);
    }
  };

  const handleEditAsesor = (asesor: Asesor) => {
    setEditandoAsesor(asesor);
    setEmailAsesor(asesor.email);
    setNombreCompletoAsesor(asesor.nombreCompleto);
    setWhatsappAsesor(asesor.whatsappNumber);
    setPasswordAsesor("");
    setKey("asesores");
  };

  const handleUpdateAsesor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!editandoAsesor) return;
    try {
      await updateDoc(doc(db, "usuarios", editandoAsesor.id), {
        nombreCompleto: nombreCompletoAsesor,
        whatsappNumber: whatsappAsesor,
      });
      setSuccess("Asesor actualizado exitosamente!");
      setEditandoAsesor(null);
      setEmailAsesor("");
      setNombreCompletoAsesor("");
      setWhatsappAsesor("");
      setPasswordAsesor("");
    } catch (err: unknown) {
      console.error("Error al actualizar asesor:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al actualizar asesor: ${message}`);
    }
  };

  const handleDeleteAsesor = async (id: string) => {
    setError("");
    setSuccess("");
    if (
      window.confirm(
        "¿Eliminar asesor? Esto lo elimina del listado y su acceso.",
      )
    ) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        setSuccess("Asesor eliminado exitosamente del listado.");
      } catch (err: unknown) {
        console.error("Error al eliminar asesor:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar asesor: ${message}`);
      }
    }
  };

  const resetSlideForm = () => {
    setUrlImagenSlide("");
    setTituloSlide("");
    setOrdenSlide("");
    setActivoSlide(true);
    setEditandoSlide(null);
    setPreviewImagenSlide("");
  };

  const handleUrlImagenChange = (url: string) => {
    setUrlImagenSlide(url);
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      setPreviewImagenSlide(url);
    } else {
      setPreviewImagenSlide("");
    }
  };

  const handleSubmitSlide = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !urlImagenSlide ||
      (!urlImagenSlide.startsWith("http://") &&
        !urlImagenSlide.startsWith("https://"))
    ) {
      setError(
        "Por favor ingresa una URL válida para la imagen (debe comenzar con http:// o https://)",
      );
      return;
    }

    try {
      const payload = {
        url_imagen: urlImagenSlide,
        titulo: tituloSlide || "",
        orden: parseInt(ordenSlide) || 0,
        activo: activoSlide,
        createdAt: editandoSlide ? editandoSlide.createdAt : new Date(),
      };

      if (editandoSlide) {
        await updateDoc(doc(db, "carrusel", editandoSlide.id), payload);
        setSuccess("Slide actualizado exitosamente!");
      } else {
        await addDoc(collection(db, "carrusel"), payload);
        setSuccess("Slide agregado exitosamente!");
      }
      resetSlideForm();
    } catch (err: unknown) {
      console.error("Error al guardar slide:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al guardar slide: ${message}`);
    }
  };

  const handleEditSlide = (slide: CarouselSlideAdmin) => {
    setEditandoSlide(slide);
    setUrlImagenSlide(slide.url_imagen || "");
    setTituloSlide(slide.titulo || "");
    setOrdenSlide(slide.orden?.toString() || "");
    setActivoSlide(slide.activo !== false);
    setPreviewImagenSlide(slide.url_imagen || "");
    setKey("carrusel");
  };

  const handleDeleteSlide = async (id: string) => {
    setError("");
    setSuccess("");
    if (window.confirm("¿Estás seguro de que quieres eliminar este slide?")) {
      try {
        await deleteDoc(doc(db, "carrusel", id));
        setSuccess("Slide eliminado exitosamente!");
      } catch (err: unknown) {
        console.error("Error al eliminar slide:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar slide: ${message}`);
      }
    }
  };

  const handleToggleActivoSlide = async (slide: CarouselSlideAdmin) => {
    try {
      await updateDoc(doc(db, "carrusel", slide.id), {
        activo: !slide.activo,
      });
      setSuccess(
        `Slide ${!slide.activo ? "activado" : "desactivado"} exitosamente!`,
      );
    } catch (err: unknown) {
      console.error("Error al cambiar estado del slide:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al cambiar estado: ${message}`);
    }
  };

  const handleLogoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoNegocio(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Panel de Administración</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tabs
        id="admin-panel-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k || "productos")}
        className="mb-3"
      >
        <Tab eventKey="productos" title="Gestionar Productos">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">
              {editandoProducto ? "Editar Producto" : "Agregar Nuevo Producto"}
            </h3>
            <Form onSubmit={handleSubmitProducto}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={descripcionProducto}
                  onChange={(e) => setDescripcionProducto(e.target.value)}
                />
              </Form.Group>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Precio Contado</Form.Label>
                    <Form.Control
                      type="number"
                      value={contadoProducto}
                      onChange={(e) => setContadoProducto(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>16 Cuotas Quincenales</Form.Label>
                    <Form.Control
                      type="number"
                      value={cuotas6Producto}
                      disabled={solo12Meses}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCuotas6Producto(v);
                        if (v === "" || v === null) {
                          setCuotas8Producto("");
                        } else {
                          const n = Number(
                            String(v).replace(/\s+/g, "").replace(/,/, "."),
                          );
                          setCuotas8Producto(
                            Number.isFinite(n) ? String(n * 2) : "",
                          );
                        }
                      }}
                    />
                    {solo12Meses && (
                      <Form.Text className="text-muted">
                        Deshabilitado (modo 12 meses activo)
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>8 Cuotas Mensuales</Form.Label>
                    <Form.Control
                      type="number"
                      value={cuotas8Producto}
                      disabled={solo12Meses}
                      onChange={(e) => setCuotas8Producto(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      {solo12Meses
                        ? "Deshabilitado (modo 12 meses activo)"
                        : "Se completa automáticamente como el doble de las 16 quincenas (editable)."}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cuota Inicial (opcional)</Form.Label>
                    <Form.Control
                      type="number"
                      value={cuotaInicialProducto}
                      onChange={(e) => setCuotaInicialProducto(e.target.value)}
                      min={0}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>URL Imagen</Form.Label>
                    <Form.Control
                      type="text"
                      value={imagenProducto}
                      onChange={(e) => setImagenProducto(e.target.value)}
                      placeholder="https://…"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Card className="p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">
                    Promoción
                    {promoActivo && (
                      <Badge bg="danger" className="ms-2">
                        ACTIVA
                      </Badge>
                    )}
                  </h5>
                  <Form.Check
                    type="switch"
                    id="promo-switch"
                    label={promoActivo ? "Promo activa" : "Promo inactiva"}
                    checked={promoActivo}
                    onChange={(e) => setPromoActivo(e.target.checked)}
                  />
                </div>

                <Row className="mt-2 g-3">
                  <Col md={3}>
                    <Form.Label>Precio promo</Form.Label>
                    <Form.Control
                      type="number"
                      value={promoPrice}
                      disabled={!promoActivo}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      placeholder="ej. 899000"
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Texto del badge</Form.Label>
                    <Form.Control
                      value={promoBadgeText}
                      disabled={!promoActivo}
                      onChange={(e) => setPromoBadgeText(e.target.value)}
                      placeholder="PROMO"
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Color badge</Form.Label>
                    <Form.Control
                      type="color"
                      value={promoBadgeBg}
                      disabled={!promoActivo}
                      onChange={(e) => setPromoBadgeBg(e.target.value)}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Highlight tarjeta</Form.Label>
                    <Form.Control
                      value={promoHighlight}
                      disabled={!promoActivo}
                      onChange={(e) => setPromoHighlight(e.target.value)}
                      placeholder="rgba(...) o #hex (opcional)"
                    />
                  </Col>
                </Row>

                <Row className="mt-2 g-3 align-items-center">
                  <Col md={6}>
                    <Form.Label>Tipo de etiqueta</Form.Label>
                    <Form.Select
                      value={badgeMode}
                      onChange={(e) => setBadgeMode(e.target.value)}
                    >
                      <option value="none">Ninguna</option>
                      <option value="promo">Só]!d~[pidolo</option>
                      <option value="nuevo">Só Nuevo</option>
                      <option value="ambos">Promo + Nuevo</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Selecciona qué etiqueta(es) deben mostrarse en el
                      catálogo.
                    </Form.Text>
                  </Col>
                </Row>

                <hr />

                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Producto Nuevo</h6>
                  <Form.Check
                    type="switch"
                    id="nuevo-switch"
                    label={nuevoActivo ? "Nuevo activo" : "Nuevo inactivo"}
                    checked={nuevoActivo}
                    onChange={(e) => setNuevoActivo(e.target.checked)}
                  />
                </div>

                <Row className="mt-2 g-3">
                  <Col md={6}>
                    <Form.Label>Texto badge nuevo</Form.Label>
                    <Form.Control
                      type="text"
                      value={nuevoBadgeText}
                      disabled={!nuevoActivo}
                      onChange={(e) => setNuevoBadgeText(e.target.value)}
                      placeholder="NUEVO"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Color badge nuevo</Form.Label>
                    <Form.Control
                      type="color"
                      value={nuevoBadgeBg}
                      disabled={!nuevoActivo}
                      onChange={(e) => setNuevoBadgeBg(e.target.value)}
                    />
                  </Col>
                </Row>

                <Form.Text className="text-muted">
                  Si dejas colores vacíos, se usarán los del{" "}
                  <strong>tema de temporada</strong> (si está activo).
                </Form.Text>
              </Card>

              <Card
                className="p-3 mb-3"
                style={{ borderLeft: "4px solid #2196f3" }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">
                    Financiación Exclusiva 12 Meses
                    {solo12Meses && (
                      <Badge bg="info" className="ms-2">
                        ACTIVA
                      </Badge>
                    )}
                  </h5>
                  <Form.Check
                    type="switch"
                    id="solo12meses-switch"
                    label={solo12Meses ? "Activo" : "Inactivo"}
                    checked={solo12Meses}
                    onChange={(e) => setSolo12Meses(e.target.checked)}
                  />
                </div>

                <Row className="mt-3 g-3">
                  <Col md={12}>
                    <Form.Label>Cuota Mensual (12 meses)</Form.Label>
                    <Form.Control
                      type="number"
                      value={cuotas12Producto}
                      disabled={!solo12Meses}
                      onChange={(e) => setCuotas12Producto(e.target.value)}
                      placeholder="ej. 150000"
                    />
                    <Form.Text className="text-muted">
                      <strong>Importante:</strong> Cuando se active esta opción,
                      el producto mostrará <strong>ÚNICAMENTE</strong> el plan
                      de 12 cuotas mensuales en el catálogo. Los campos de 16
                      quincenas y 8 meses se deshabilitarán pero sus valores se
                      conservarán.
                    </Form.Text>
                  </Col>
                </Row>
              </Card>

              <Button variant="primary" type="submit" className="me-2">
                {editandoProducto ? "Actualizar Producto" : "Agregar Producto"}
              </Button>
              {editandoProducto && (
                <Button variant="secondary" onClick={resetProductoForm}>
                  Cancelar Edición
                </Button>
              )}
            </Form>
          </Card>

          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Productos Actuales</h3>

            <InputGroup className="mb-3">
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar producto por nombre o referencia..."
                value={searchProducto}
                onChange={(e) => setSearchProducto(e.target.value)}
              />
              {searchProducto && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setSearchProducto("")}
                >
                  Limpiar
                </Button>
              )}
            </InputGroup>

            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "80px" }}>Imagen</th>
                    <th>Nombre</th>
                    <th style={{ width: "130px" }}>Precio Contado</th>
                    <th style={{ width: "130px" }}>Precio Crédito</th>
                    <th style={{ width: "120px" }}>Etiquetas</th>
                    <th style={{ width: "180px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos
                    .filter((producto) => {
                      if (!searchProducto) return true;
                      const searchLower = searchProducto.toLowerCase();
                      const nombre = (producto.nombre || "").toLowerCase();
                      const descripcion = (
                        producto.descripcion || ""
                      ).toLowerCase();
                      return (
                        nombre.includes(searchLower) ||
                        descripcion.includes(searchLower)
                      );
                    })
                    .map((producto) => (
                      <tr key={producto.id}>
                        <td className="text-center align-middle">
                          <img
                            src={
                              producto.imagen ||
                              "https://via.placeholder.com/60"
                            }
                            alt={producto.nombre}
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "contain",
                              borderRadius: "4px",
                            }}
                          />
                        </td>

                        <td className="align-middle">
                          <strong>{producto.nombre}</strong>
                          {producto.descripcion && (
                            <div
                              className="text-muted small"
                              style={{
                                maxWidth: "300px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {producto.descripcion}
                            </div>
                          )}
                        </td>

                        <td className="align-middle">
                          {producto.promo && producto.promoPrice ? (
                            <>
                              <div
                                className="text-muted small"
                                style={{ textDecoration: "line-through" }}
                              >
                                $
                                {parseFloat(String(producto.contado)).toLocaleString(
                                  "es-CO",
                                )}
                              </div>
                              <strong className="text-danger">
                                $
                                {parseFloat(String(producto.promoPrice)).toLocaleString(
                                  "es-CO",
                                )}
                              </strong>
                            </>
                          ) : (
                            <strong>
                              {producto.contado
                                ? `$${parseFloat(String(producto.contado)).toLocaleString("es-CO")}`
                                : "N/A"}
                            </strong>
                          )}
                        </td>

                        <td className="align-middle">
                          {producto.solo12Meses && producto.cuotas12 ? (
                            <div className="small">
                              <Badge
                                bg="info"
                                className="mb-1 d-block"
                                style={{ fontSize: "0.65rem" }}
                              >
                                12 MESES
                              </Badge>
                              <div>
                                <strong>
                                  $
                                  {parseFloat(String(producto.cuotas12)).toLocaleString(
                                    "es-CO",
                                  )}
                                </strong>
                                <span className="text-muted"> /mes</span>
                              </div>
                            </div>
                          ) : producto.cuotas6 ? (
                            <>
                              <div className="small">
                                <strong>
                                  $
                                  {parseFloat(String(producto.cuotas6)).toLocaleString(
                                    "es-CO",
                                  )}
                                </strong>
                                <span className="text-muted"> /quinc.</span>
                              </div>
                              {producto.cuotas8 && (
                                <div className="small text-muted">
                                  $
                                  {parseFloat(String(producto.cuotas8)).toLocaleString(
                                    "es-CO",
                                  )}{" "}
                                  /mes
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>

                        <td className="align-middle">
                          <div className="d-flex flex-column gap-1">
                            {producto.promo &&
                              (producto.badgeMode === "promo" ||
                                producto.badgeMode === "ambos") && (
                                <Badge
                                  bg="danger"
                                  style={{
                                    backgroundColor:
                                      producto.promoBadgeBg || "#d81b60",
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  {producto.promoBadgeText || "PROMO"}
                                </Badge>
                              )}
                            {producto.nuevo &&
                              (producto.badgeMode === "nuevo" ||
                                producto.badgeMode === "ambos") && (
                                <Badge
                                  bg="success"
                                  style={{
                                    backgroundColor:
                                      producto.nuevoBadgeBg || "#28a745",
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  {producto.nuevoBadgeText || "NUEVO"}
                                </Badge>
                              )}
                            {(!producto.promo && !producto.nuevo) ||
                            producto.badgeMode === "none" ? (
                              <span className="text-muted small">-</span>
                            ) : null}
                          </div>
                        </td>

                        <td className="align-middle">
                          <div className="d-flex gap-2">
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleEditProducto(producto)}
                              style={{ minWidth: "70px" }}
                            >
                              ✏️ Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteProducto(producto.id)}
                              style={{ minWidth: "80px" }}
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>

              {productos.filter((producto) => {
                if (!searchProducto) return true;
                const searchLower = searchProducto.toLowerCase();
                const nombre = (producto.nombre || "").toLowerCase();
                const descripcion = (producto.descripcion || "").toLowerCase();
                return (
                  nombre.includes(searchLower) ||
                  descripcion.includes(searchLower)
                );
              }).length === 0 && (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">
                    {searchProducto
                      ? `No se encontraron productos que coincidan con "${searchProducto}"`
                      : "No hay productos registrados"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </Tab>

        <Tab eventKey="negocio" title="Configuración del Negocio">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Configuración del Negocio</h3>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateConfig();
              }}
            >
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Negocio</Form.Label>
                    <Form.Control
                      type="text"
                      value={nombreNegocio}
                      onChange={(e) => setNombreNegocio(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Logo del Negocio (URL o archivo)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                    />
                    <Form.Control
                      type="text"
                      className="mt-2"
                      value={previewLogo}
                      onChange={(e) => {
                        setLogoNegocio(null);
                        setPreviewLogo(e.target.value);
                      }}
                      placeholder="O pega una URL (https://ejemplo.com/logo.png)"
                    />
                    {previewLogo && (
                      <img
                        src={previewLogo}
                        alt="Preview Logo"
                        style={{ height: "80px", marginTop: "10px" }}
                        className="d-block"
                      />
                    )}
                    <Form.Text className="text-muted">
                      Sube un archivo o pega la URL de tu logo (ej: desde Firebase Storage, Imgur,
                      etc.)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Card className="p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">Tema de temporada</h5>
                  <Form.Check
                    type="switch"
                    label={themeEnabled ? "Tema activo" : "Tema inactivo"}
                    checked={themeEnabled}
                    onChange={(e) => setThemeEnabled(e.target.checked)}
                  />
                </div>

                <Row className="mt-2 g-3">
                  <Col md={6}>
                    <Form.Label>Inicio (opcional)</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={themeStart}
                      onChange={(e) => setThemeStart(e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Fin (opcional)</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={themeEnd}
                      onChange={(e) => setThemeEnd(e.target.value)}
                    />
                  </Col>

                  <Col md={4}>
                    <Form.Label>Color badge promo</Form.Label>
                    <Form.Control
                      type="color"
                      value={themeVars["--promo-badge-bg"] || "#d81b60"}
                      onChange={(e) =>
                        setThemeVars((v) => ({
                          ...v,
                          ["--promo-badge-bg"]: e.target.value,
                        }))
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Texto badge promo</Form.Label>
                    <Form.Control
                      type="color"
                      value={themeVars["--promo-badge-text"] || "#ffffff"}
                      onChange={(e) =>
                        setThemeVars((v) => ({
                          ...v,
                          ["--promo-badge-text"]: e.target.value,
                        }))
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Resaltado tarjetas</Form.Label>
                    <Form.Control
                      value={
                        themeVars["--promo-highlight"] || "rgba(216,27,96,.18)"
                      }
                      onChange={(e) =>
                        setThemeVars((v) => ({
                          ...v,
                          ["--promo-highlight"]: e.target.value,
                        }))
                      }
                    />
                  </Col>
                </Row>

                <div className="d-flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setThemeVars((v) => ({
                        ...v,
                        "--promo-badge-bg": "#d81b60",
                        "--promo-badge-text": "#ffffff",
                        "--promo-highlight": "rgba(216,27,96,.18)",
                        "--theme-name": "valentine",
                      }))
                    }
                  >
                    💘 Amor y Amistad
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() =>
                      setThemeVars((v) => ({
                        ...v,
                        "--promo-badge-bg": "#2e7d32",
                        "--promo-badge-text": "#ffffff",
                        "--promo-highlight": "rgba(46,125,50,.18)",
                        "--theme-name": "christmas",
                      }))
                    }
                  >
                    🎄 Navidad
                  </Button>
                  <Button
                    size="sm"
                    variant="warning"
                    onClick={() =>
                      setThemeVars((v) => ({
                        ...v,
                        "--promo-badge-bg": "#ff6d00",
                        "--promo-badge-text": "#1b1b1b",
                        "--promo-highlight": "rgba(255,109,0,.18)",
                        "--theme-name": "halloween",
                      }))
                    }
                  >
                    🎃 Halloween
                  </Button>
                </div>
              </Card>

              <Button variant="primary" type="submit">
                Actualizar Configuración
              </Button>
            </Form>
          </Card>
        </Tab>

        <Tab eventKey="asesores" title="Gestionar Asesores">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">
              {editandoAsesor ? "Editar Asesor" : "Registrar Nuevo Asesor"}
            </h3>
            <Form
              onSubmit={editandoAsesor ? handleUpdateAsesor : handleAddAsesor}
            >
              <Form.Group className="mb-3">
                <Form.Label>Nombre Completo</Form.Label>
                <Form.Control
                  type="text"
                  value={nombreCompletoAsesor}
                  onChange={(e) => setNombreCompletoAsesor(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={emailAsesor}
                  onChange={(e) => setEmailAsesor(e.target.value)}
                  required
                  disabled={!!editandoAsesor}
                />
              </Form.Group>
              {!editandoAsesor && (
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordAsesor}
                    onChange={(e) => setPasswordAsesor(e.target.value)}
                    required
                  />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Número de WhatsApp</Form.Label>
                <Form.Control
                  type="text"
                  value={whatsappAsesor}
                  onChange={(e) => setWhatsappAsesor(e.target.value)}
                  placeholder="Ej: 573XXYYYYYYY"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Rol</Form.Label>
                <Form.Select
                  value={rolAsesor}
                  onChange={(e) => setRolAsesor(e.target.value)}
                  disabled={!!editandoAsesor}
                >
                  <option value="asesor">Asesor (Acceso total)</option>
                </Form.Select>
              </Form.Group>
              <Button variant="primary" type="submit" className="me-2">
                {editandoAsesor ? "Actualizar Asesor" : "Registrar Asesor"}
              </Button>
              {editandoAsesor && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditandoAsesor(null);
                    setEmailAsesor("");
                    setNombreCompletoAsesor("");
                    setWhatsappAsesor("");
                    setPasswordAsesor("");
                  }}
                >
                  Cancelar Edición
                </Button>
              )}
            </Form>
          </Card>

          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Asesores Registrados</h3>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asesores.map((asesor) => (
                  <tr key={asesor.id}>
                    <td>{asesor.nombreCompleto}</td>
                    <td>{asesor.email}</td>
                    <td>{asesor.whatsappNumber}</td>
                    <td>{asesor.rol}</td>
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEditAsesor(asesor)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteAsesor(asesor.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Tab>

        <Tab eventKey="carrusel" title="Carrusel Hero">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">
              {editandoSlide ? "Editar Slide" : "Agregar Nuevo Slide"}
            </h3>
            <Form onSubmit={handleSubmitSlide}>
              <Form.Group className="mb-3">
                <Form.Label>URL de la Imagen</Form.Label>
                <Form.Control
                  type="text"
                  value={urlImagenSlide}
                  onChange={(e) => handleUrlImagenChange(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  required
                />
                <Form.Text className="text-muted">
                  Ingresa la URL completa de la imagen (debe comenzar con
                  http:// o https://)
                </Form.Text>
              </Form.Group>

              {previewImagenSlide && (
                <div className="mb-3">
                  <Form.Label>Vista Previa</Form.Label>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      height: "200px",
                      overflow: "hidden",
                      borderRadius: "8px",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <img
                      src={previewImagenSlide}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6c757d;">Error al cargar la imagen</div>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Título/Texto del Slide (opcional)</Form.Label>
                <Form.Control
                  type="text"
                  value={tituloSlide}
                  onChange={(e) => setTituloSlide(e.target.value)}
                  placeholder="Ej: ¡Ofertas Especiales!"
                />
                <Form.Text className="text-muted">
                  Este texto se mostrará sobre la imagen con fondo oscuro para
                  mejor legibilidad
                </Form.Text>
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Orden de Visualización</Form.Label>
                    <Form.Control
                      type="number"
                      value={ordenSlide}
                      onChange={(e) => setOrdenSlide(e.target.value)}
                      placeholder="1, 2, 3..."
                      min="0"
                      required
                    />
                    <Form.Text className="text-muted">
                      Los slides se mostrarán en orden ascendente (1, 2, 3...)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Check
                      type="switch"
                      id="activo-slide-switch"
                      label={activoSlide ? "Slide Activo" : "Slide Inactivo"}
                      checked={activoSlide}
                      onChange={(e) => setActivoSlide(e.target.checked)}
                    />
                    <Form.Text className="text-muted">
                      Solo los slides activos se mostrarán en el carrusel
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Button variant="primary" type="submit" className="me-2">
                {editandoSlide ? "Actualizar Slide" : "Agregar Slide"}
              </Button>
              {editandoSlide && (
                <Button variant="secondary" onClick={resetSlideForm}>
                  Cancelar Edición
                </Button>
              )}
            </Form>
          </Card>

          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Slides del Carrusel</h3>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "100px" }}>Imagen</th>
                    <th>Título</th>
                    <th style={{ width: "80px" }}>Orden</th>
                    <th style={{ width: "100px" }}>Estado</th>
                    <th style={{ width: "250px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {slides
                    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                    .map((slide) => (
                      <tr key={slide.id}>
                        <td className="text-center align-middle">
                          <img
                            src={
                              slide.url_imagen ||
                              "https://via.placeholder.com/80"
                            }
                            alt={slide.titulo || "Slide"}
                            style={{
                              width: "80px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        </td>
                        <td className="align-middle">
                          {slide.titulo || (
                            <span className="text-muted">Sin título</span>
                          )}
                        </td>
                        <td className="align-middle text-center">
                          <Badge bg="secondary">{slide.orden || 0}</Badge>
                        </td>
                        <td className="align-middle text-center">
                          <Badge bg={slide.activo ? "success" : "secondary"}>
                            {slide.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="align-middle">
                          <div className="d-flex gap-2 flex-wrap">
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleEditSlide(slide)}
                            >
                              ✏️ Editar
                            </Button>
                            <Button
                              variant={slide.activo ? "secondary" : "success"}
                              size="sm"
                              onClick={() => handleToggleActivoSlide(slide)}
                            >
                              {slide.activo ? "🔒 Desactivar" : "✅ Activar"}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteSlide(slide.id)}
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>

              {slides.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">
                    No hay slides registrados. Agrega el primero arriba.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default AdminPanel;