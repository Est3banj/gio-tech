// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getApp, getApps, initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getAuthSecondary } from 'firebase/auth';

import { Container, Row, Col, Form, Button, Card, Table, Alert, Tabs, Tab, InputGroup, Badge } from 'react-bootstrap';

function AdminPanel() {
  // ===== Productos =====
  const [nombreProducto, setNombreProducto] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [contadoProducto, setContadoProducto] = useState('');
  const [cuotas6Producto, setCuotas6Producto] = useState('');
  const [cuotas8Producto, setCuotas8Producto] = useState('');
  const [imagenProducto, setImagenProducto] = useState('');
  const [cuotaInicialProducto, setCuotaInicialProducto] = useState('');
  const [productos, setProductos] = useState([]);
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [searchProducto, setSearchProducto] = useState(''); // Estado para búsqueda

  // >>> Campos de PROMO por producto <<<
  const [promoActivo, setPromoActivo] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');
  const [promoBadgeText, setPromoBadgeText] = useState('PROMO');
  const [promoBadgeBg, setPromoBadgeBg] = useState('#d81b60');
  const [promoHighlight, setPromoHighlight] = useState(''); // rgba(...) o #hex (opcional)

  // >>> Campos de "Producto Nuevo"
  const [nuevoActivo, setNuevoActivo] = useState(false);
  const [nuevoBadgeText, setNuevoBadgeText] = useState('NUEVO');
  const [nuevoBadgeBg, setNuevoBadgeBg] = useState('#28a745'); // verde por defecto

  // >>> Modo de badge (controla visualización) - 'none'|'promo'|'nuevo'|'ambos'
  const [badgeMode, setBadgeMode] = useState('promo');

  // ===== Configuración del negocio / tema =====
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [logoNegocio, setLogoNegocio] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');
  const [configId, setConfigId] = useState('');

  // >>> Theme (panel sin tocar código) <<<
  const [themeEnabled, setThemeEnabled] = useState(false);
  const [themeStart, setThemeStart] = useState('');
  const [themeEnd, setThemeEnd] = useState('');
  const [themeVars, setThemeVars] = useState({
    '--promo-badge-bg': '#d81b60',
    '--promo-badge-text': '#ffffff',
    '--promo-highlight': 'rgba(216,27,96,.18)',
    // Puedes agregar más, ej: '--gio-primary': '#0d6efd'
  });

  // ===== Asesores =====
  const [asesores, setAsesores] = useState([]);
  const [emailAsesor, setEmailAsesor] = useState('');
  const [passwordAsesor, setPasswordAsesor] = useState('');
  const [nombreCompletoAsesor, setNombreCompletoAsesor] = useState('');
  const [whatsappAsesor, setWhatsappAsesor] = useState('');
  const [editandoAsesor, setEditandoAsesor] = useState(null);

  // ===== Carrusel Hero =====
  const [slides, setSlides] = useState([]);
  const [urlImagenSlide, setUrlImagenSlide] = useState('');
  const [tituloSlide, setTituloSlide] = useState('');
  const [ordenSlide, setOrdenSlide] = useState('');
  const [activoSlide, setActivoSlide] = useState(true);
  const [editandoSlide, setEditandoSlide] = useState(null);
  const [previewImagenSlide, setPreviewImagenSlide] = useState('');

  // ===== Mensajes / pestañas =====
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [key, setKey] = useState('productos');

  const storage = getStorage();

  // --- Specs parser (inlined helper) ---
  function parseDescriptionToSpecs(description = "") {
    if (!description || typeof description !== 'string') return {};
    const text = description.toLowerCase();

    const toNum = (v) => {
      if (v === 0 || v) {
        const s = String(v).replace(/[^0-9.,]/g, "").replace(",", ".");
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    // almacenamiento (GB)
    const almacenamientoMatch = text.match(/\b(\d{2,4})\s?gb\b/);
    const almacenamiento = almacenamientoMatch ? toNum(almacenamientoMatch[1]) : null;

    // RAM (GB)
    const ramMatch = text.match(/\b(\d{1,2})\s?gb\s?de\s?ram\b/) || text.match(/\b(\d{1,2})\s?gb\s?ram\b/) || text.match(/\b(\d{1,2})\s?gb\b/);
    const ram = ramMatch ? toNum(ramMatch[1]) : null;

    // Cámara (MP)
    const camMatch = text.match(/(\d{2,4})\s?mp\b/) || text.match(/cámara\s?de\s?(\d{2,4})\s?mp/);
    const camara = camMatch ? toNum(camMatch[1] || camMatch[2]) : null;

    // Pantalla (pulgadas)
    const screenMatch = text.match(/(\d{1,2}(?:[.,]\d)?)\s?(?:pulgadas|")/) || text.match(/pantalla.*?(\d{1,2}(?:[.,]\d)?)/);
    const pantalla = screenMatch ? toNum((screenMatch[1] || screenMatch[2] || "").replace(",", ".")) : null;

    // Batería (mAh)
    const batMatch = text.match(/(\d{3,5})\s?m(?:ah)?\b/);
    const bateria = batMatch ? toNum(batMatch[1]) : null;

    return {
      almacenamiento: almacenamiento || null,
      ram: ram || null,
      camara: camara || null,
      pantalla: pantalla || null,
      bateria: bateria || null
    };
  }

  // Helpers tema
  const toTimeInput = (ts) => {
    if (!ts) return '';
    const ms = ts?.seconds ? ts.seconds * 1000 : Date.parse(ts);
    return isNaN(ms) ? '' : new Date(ms).toISOString().slice(0, 16);
  };
  const toDateOrNull = (s) => (s ? new Date(s) : null);

  // ===== Suscripciones =====
  useEffect(() => {
    // productos
    const unsubProductos = onSnapshot(collection(db, "productos"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);
    });

    // configuracion/general
    const unsubConfig = onSnapshot(doc(db, "configuracion", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNombreNegocio(data.nombre || '');
        setPreviewLogo(data.logo || '');
        setConfigId(docSnap.id);

        const theme = data.theme || null;
        if (theme) {
          setThemeEnabled(!!theme.enabled);
          setThemeStart(toTimeInput(theme.start));
          setThemeEnd(toTimeInput(theme.end));
          setThemeVars((curr) => ({ ...curr, ...(theme.vars || {}) }));
        }
      }
    });

    // asesores
    const unsubAsesores = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const listaAsesores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAsesores(listaAsesores);
    });

    // carrusel
    const unsubCarrusel = onSnapshot(collection(db, "carrusel"), (snapshot) => {
      const listaSlides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSlides(listaSlides);
    });

    return () => {
      unsubProductos();
      unsubConfig();
      unsubAsesores();
      unsubCarrusel();
    };
  }, []);

  // ===== Productos: CRUD =====
  const resetProductoForm = () => {
    setNombreProducto('');
    setDescripcionProducto('');
    setContadoProducto('');
    setCuotas6Producto('');
    setCuotas8Producto('');
    setImagenProducto('');
    setCuotaInicialProducto('');

    // promo
    setPromoActivo(false);
    setPromoPrice('');
    setPromoBadgeText('PROMO');
    setPromoBadgeBg('#d81b60');
    setPromoHighlight('');

    // nuevo
    setNuevoActivo(false);
    setNuevoBadgeText('NUEVO');
    setNuevoBadgeBg('#28a745');

    // badge mode
    setBadgeMode('promo');

    setEditandoProducto(null);
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const specs = parseDescriptionToSpecs(descripcionProducto || '');

    // Normalizar y convertir a números para evitar inconsistencias
    const parseNumberSafe = (v) => {
      if (v === '' || v === null || typeof v === 'undefined') return null;
      // Convertir comas a punto y eliminar espacios
      const s = String(v).replace(/\s+/g, '').replace(/,/, '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const contadoVal = parseNumberSafe(contadoProducto);
    const cuotas6Val = parseNumberSafe(cuotas6Producto);
    const cuotas8Val = parseNumberSafe(cuotas8Producto);
    const cuotaInicialVal = parseNumberSafe(cuotaInicialProducto);

    try {
      const payload = {
        nombre: nombreProducto,
        descripcion: descripcionProducto,
        contado: contadoVal,
        cuotas6: cuotas6Val,
        cuotas8: cuotas8Val,
        imagen: imagenProducto,
        cuotaInicial: cuotaInicialVal,
        specs: specs,
        // promo fields
        promo: !!promoActivo,
        promoPrice: promoActivo ? Number(promoPrice || 0) : null,
        promoBadgeText: promoActivo ? (promoBadgeText || 'PROMO') : null,
        promoBadgeBg: promoActivo ? (promoBadgeBg || null) : null,
        promoHighlight: promoActivo ? (promoHighlight || null) : null,
        // nuevo badge
        nuevo: !!nuevoActivo,
        nuevoBadgeText: nuevoActivo ? (nuevoBadgeText || 'NUEVO') : null,
        nuevoBadgeBg: nuevoActivo ? (nuevoBadgeBg || null) : null,
        // badge display mode
        badgeMode: badgeMode || 'promo'
      };

      if (editandoProducto) {
        await updateDoc(doc(db, "productos", editandoProducto.id), payload);
        setSuccess('Producto actualizado exitosamente!');
      } else {
        await addDoc(collection(db, "productos"), payload);
        setSuccess('Producto agregado exitosamente!');
      }
      resetProductoForm();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError(`Error al guardar producto: ${err.message}`);
    }
  };

  const handleEditProducto = (producto) => {
    setEditandoProducto(producto);
    setNombreProducto(producto.nombre);
    setDescripcionProducto(producto.descripcion || '');
    setContadoProducto(producto.contado || '');
    setCuotas6Producto(producto.cuotas6 || '');
    setCuotas8Producto(producto.cuotas8 || '');
    setImagenProducto(producto.imagen || '');
    setCuotaInicialProducto(producto.cuotaInicial || '');

    // promo
    setPromoActivo(!!producto.promo);
    setPromoPrice(producto.promoPrice ?? '');
    setPromoBadgeText(producto.promoBadgeText || 'PROMO');
    setPromoBadgeBg(producto.promoBadgeBg || '#d81b60');
    setPromoHighlight(producto.promoHighlight || '');

    // nuevo
    setNuevoActivo(!!producto.nuevo);
    setNuevoBadgeText(producto.nuevoBadgeText || 'NUEVO');
    setNuevoBadgeBg(producto.nuevoBadgeBg || '#28a745');

    // badge mode
    setBadgeMode(producto.badgeMode || 'promo');
  };

  const handleDeleteProducto = async (id) => {
    setError(''); setSuccess('');
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, "productos", id));
        setSuccess('Producto eliminado exitosamente!');
      } catch (err) {
        console.error("Error al eliminar producto:", err);
        setError(`Error al eliminar producto: ${err.message}`);
      }
    }
  };

  // ===== Configuración del negocio =====
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogoNegocio(e.target.files[0]);
      setPreviewLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdateConfig = async () => {
    setError(''); setSuccess('');
    try {
      let logoUrl = previewLogo;
      if (logoNegocio) {
        const logoRef = ref(storage, `config/logo_${Date.now()}`);
        await uploadBytes(logoRef, logoNegocio);
        logoUrl = await getDownloadURL(logoRef);
      }
      await setDoc(doc(db, "configuracion", "general"), {
        nombre: nombreNegocio,
        logo: logoUrl,
        theme: {
          enabled: themeEnabled,
          start: toDateOrNull(themeStart),
          end: toDateOrNull(themeEnd),
          vars: themeVars
        }
      }, { merge: true });
      setSuccess('Configuración actualizada exitosamente!');
      setLogoNegocio(null);
    } catch (err) {
      console.error("Error al actualizar configuración:", err);
      setError(`Error al actualizar configuración: ${err.message}`);
    }
  };

  // ===== Asesores =====
  const handleAddAsesor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const primaryApp = getApp();
      const secondaryApp =
        getApps().find(a => a.name === 'Secondary') || initializeApp(primaryApp.options, 'Secondary');
      const secondaryAuth = getAuthSecondary(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, emailAsesor, passwordAsesor);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        email: emailAsesor,
        nombreCompleto: nombreCompletoAsesor,
        rol: "asesor",
        whatsappNumber: whatsappAsesor
      });

      try { await secondaryAuth.signOut?.(); } catch (_) { }
      try { await deleteApp(secondaryApp); } catch (_) { }

      setSuccess('Asesor registrado exitosamente!');
      setEmailAsesor('');
      setPasswordAsesor('');
      setNombreCompletoAsesor('');
      setWhatsappAsesor('');
    } catch (err) {
      console.error("Error al registrar asesor:", err);
      setError(`Error al registrar asesor: ${err.message}`);
    }
  };

  const handleEditAsesor = (asesor) => {
    setEditandoAsesor(asesor);
    setEmailAsesor(asesor.email);
    setNombreCompletoAsesor(asesor.nombreCompleto);
    setWhatsappAsesor(asesor.whatsappNumber);
    setPasswordAsesor('');
    setKey('asesores');
  };

  const handleUpdateAsesor = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!editandoAsesor) return;
    try {
      await updateDoc(doc(db, "usuarios", editandoAsesor.id), {
        nombreCompleto: nombreCompletoAsesor,
        whatsappNumber: whatsappAsesor
      });
      setSuccess('Asesor actualizado exitosamente!');
      setEditandoAsesor(null);
      setEmailAsesor('');
      setNombreCompletoAsesor('');
      setWhatsappAsesor('');
      setPasswordAsesor('');
    } catch (err) {
      console.error("Error al actualizar asesor:", err);
      setError(`Error al actualizar asesor: ${err.message}`);
    }
  };

  const handleDeleteAsesor = async (id) => {
    setError('');
    setSuccess('');
    if (window.confirm("¿Eliminar asesor? Esto lo elimina del listado y su acceso.")) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        setSuccess('Asesor eliminado exitosamente del listado.');
      } catch (err) {
        console.error("Error al eliminar asesor:", err);
        setError(`Error al eliminar asesor: ${err.message}`);
      }
    }
  };

  // ===== Carrusel Hero: CRUD =====
  const resetSlideForm = () => {
    setUrlImagenSlide('');
    setTituloSlide('');
    setOrdenSlide('');
    setActivoSlide(true);
    setEditandoSlide(null);
    setPreviewImagenSlide('');
  };

  const handleUrlImagenChange = (url) => {
    setUrlImagenSlide(url);
    // Actualizar preview si la URL parece válida
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setPreviewImagenSlide(url);
    } else {
      setPreviewImagenSlide('');
    }
  };

  const handleSubmitSlide = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Validación básica de URL
    if (!urlImagenSlide || (!urlImagenSlide.startsWith('http://') && !urlImagenSlide.startsWith('https://'))) {
      setError('Por favor ingresa una URL válida para la imagen (debe comenzar con http:// o https://)');
      return;
    }

    try {
      const payload = {
        url_imagen: urlImagenSlide,
        titulo: tituloSlide || '',
        orden: parseInt(ordenSlide) || 0,
        activo: activoSlide,
        createdAt: editandoSlide ? editandoSlide.createdAt : new Date()
      };

      if (editandoSlide) {
        await updateDoc(doc(db, "carrusel", editandoSlide.id), payload);
        setSuccess('Slide actualizado exitosamente!');
      } else {
        await addDoc(collection(db, "carrusel"), payload);
        setSuccess('Slide agregado exitosamente!');
      }
      resetSlideForm();
    } catch (err) {
      console.error("Error al guardar slide:", err);
      setError(`Error al guardar slide: ${err.message}`);
    }
  };

  const handleEditSlide = (slide) => {
    setEditandoSlide(slide);
    setUrlImagenSlide(slide.url_imagen || '');
    setTituloSlide(slide.titulo || '');
    setOrdenSlide(slide.orden || '');
    setActivoSlide(slide.activo !== false);
    setPreviewImagenSlide(slide.url_imagen || '');
    setKey('carrusel'); // Cambiar a la pestaña de carrusel
  };

  const handleDeleteSlide = async (id) => {
    setError(''); setSuccess('');
    if (window.confirm("¿Estás seguro de que quieres eliminar este slide?")) {
      try {
        await deleteDoc(doc(db, "carrusel", id));
        setSuccess('Slide eliminado exitosamente!');
      } catch (err) {
        console.error("Error al eliminar slide:", err);
        setError(`Error al eliminar slide: ${err.message}`);
      }
    }
  };

  const handleToggleActivoSlide = async (slide) => {
    try {
      await updateDoc(doc(db, "carrusel", slide.id), {
        activo: !slide.activo
      });
      setSuccess(`Slide ${!slide.activo ? 'activado' : 'desactivado'} exitosamente!`);
    } catch (err) {
      console.error("Error al cambiar estado del slide:", err);
      setError(`Error al cambiar estado: ${err.message}`);
    }
  };

  // ===== UI =====
  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Panel de Administración</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Tabs id="admin-panel-tabs" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
        {/* === Productos === */}
        <Tab eventKey="productos" title="Gestionar Productos">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">{editandoProducto ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
            <Form onSubmit={handleSubmitProducto}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control type="text" value={nombreProducto} onChange={e => setNombreProducto(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control as="textarea" rows={3} value={descripcionProducto} onChange={e => setDescripcionProducto(e.target.value)} />
              </Form.Group>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Precio Contado</Form.Label>
                    <Form.Control type="number" value={contadoProducto} onChange={e => setContadoProducto(e.target.value)} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>16 Cuotas Quincenales</Form.Label>
                    <Form.Control
                      type="number"
                      value={cuotas6Producto}
                      onChange={e => {
                        const v = e.target.value;
                        setCuotas6Producto(v);
                        if (v === '' || v === null) {
                          setCuotas8Producto('');
                        } else {
                          const n = Number(String(v).replace(/\s+/g, '').replace(/,/, '.'));
                          setCuotas8Producto(Number.isFinite(n) ? String(n * 2) : '');
                        }
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>8 Cuotas Mensuales</Form.Label>
                    <Form.Control type="number" value={cuotas8Producto} onChange={e => setCuotas8Producto(e.target.value)} />
                    <Form.Text className="text-muted">Se completa automáticamente como el doble de las 16 quincenas (editable).</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cuota Inicial (opcional)</Form.Label>
                    <Form.Control type="number" value={cuotaInicialProducto} onChange={e => setCuotaInicialProducto(e.target.value)} min={0} placeholder="0" />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>URL Imagen</Form.Label>
                    <Form.Control type="text" value={imagenProducto} onChange={e => setImagenProducto(e.target.value)} placeholder="https://…" />
                  </Form.Group>
                </Col>
              </Row>

              {/* === BLOQUE PROMOCIÓN === */}
              <Card className="p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">
                    Promoción
                    {promoActivo && <Badge bg="danger" className="ms-2">ACTIVA</Badge>}
                  </h5>
                  <Form.Check type="switch" id="promo-switch" label={promoActivo ? "Promo activa" : "Promo inactiva"}
                    checked={promoActivo} onChange={(e) => setPromoActivo(e.target.checked)} />
                </div>

                <Row className="mt-2 g-3">
                  <Col md={3}>
                    <Form.Label>Precio promo</Form.Label>
                    <Form.Control type="number" value={promoPrice} disabled={!promoActivo} onChange={(e) => setPromoPrice(e.target.value)} placeholder="ej. 899000" />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Texto del badge</Form.Label>
                    <Form.Control value={promoBadgeText} disabled={!promoActivo} onChange={(e) => setPromoBadgeText(e.target.value)} placeholder="PROMO" />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Color badge</Form.Label>
                    <Form.Control type="color" value={promoBadgeBg} disabled={!promoActivo} onChange={(e) => setPromoBadgeBg(e.target.value)} />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Highlight tarjeta</Form.Label>
                    <Form.Control value={promoHighlight} disabled={!promoActivo} onChange={(e) => setPromoHighlight(e.target.value)} placeholder="rgba(...) o #hex (opcional)" />
                  </Col>
                </Row>

                <Row className="mt-2 g-3 align-items-center">
                  <Col md={6}>
                    <Form.Label>Tipo de etiqueta</Form.Label>
                    <Form.Select value={badgeMode} onChange={(e) => setBadgeMode(e.target.value)}>
                      <option value="none">Ninguna</option>
                      <option value="promo">Sólo Promo</option>
                      <option value="nuevo">Sólo Nuevo</option>
                      <option value="ambos">Promo + Nuevo</option>
                    </Form.Select>
                    <Form.Text className="text-muted">Selecciona qué etiqueta(es) deben mostrarse en el catálogo.</Form.Text>
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
                  Si dejas colores vacíos, se usarán los del <strong>tema de temporada</strong> (si está activo).
                </Form.Text>
              </Card>

              <Button variant="primary" type="submit" className="me-2">
                {editandoProducto ? 'Actualizar Producto' : 'Agregar Producto'}
              </Button>
              {editandoProducto && (
                <Button variant="secondary" onClick={resetProductoForm}>Cancelar Edición</Button>
              )}
            </Form>
          </Card>

          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Productos Actuales</h3>

            {/* Buscador de productos */}
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
                  onClick={() => setSearchProducto('')}
                >
                  Limpiar
                </Button>
              )}
            </InputGroup>

            {/* Tabla de productos */}
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: '80px' }}>Imagen</th>
                    <th>Nombre</th>
                    <th style={{ width: '130px' }}>Precio Contado</th>
                    <th style={{ width: '130px' }}>Precio Crédito</th>
                    <th style={{ width: '120px' }}>Etiquetas</th>
                    <th style={{ width: '180px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos
                    .filter(producto => {
                      if (!searchProducto) return true;
                      const searchLower = searchProducto.toLowerCase();
                      const nombre = (producto.nombre || '').toLowerCase();
                      const descripcion = (producto.descripcion || '').toLowerCase();
                      return nombre.includes(searchLower) || descripcion.includes(searchLower);
                    })
                    .map(producto => (
                      <tr key={producto.id}>
                        {/* Imagen miniatura */}
                        <td className="text-center align-middle">
                          <img
                            src={producto.imagen || "https://via.placeholder.com/60"}
                            alt={producto.nombre}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'contain',
                              borderRadius: '4px'
                            }}
                          />
                        </td>

                        {/* Nombre del producto */}
                        <td className="align-middle">
                          <strong>{producto.nombre}</strong>
                          {producto.descripcion && (
                            <div className="text-muted small" style={{
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {producto.descripcion}
                            </div>
                          )}
                        </td>

                        {/* Precio Contado */}
                        <td className="align-middle">
                          {producto.promo && producto.promoPrice ? (
                            <>
                              <div className="text-muted small" style={{ textDecoration: 'line-through' }}>
                                ${parseFloat(producto.contado).toLocaleString('es-CO')}
                              </div>
                              <strong className="text-danger">
                                ${parseFloat(producto.promoPrice).toLocaleString('es-CO')}
                              </strong>
                            </>
                          ) : (
                            <strong>
                              {producto.contado ? `$${parseFloat(producto.contado).toLocaleString('es-CO')}` : 'N/A'}
                            </strong>
                          )}
                        </td>

                        {/* Precio Crédito */}
                        <td className="align-middle">
                          {producto.cuotas6 ? (
                            <>
                              <div className="small">
                                <strong>${parseFloat(producto.cuotas6).toLocaleString('es-CO')}</strong>
                                <span className="text-muted"> /quinc.</span>
                              </div>
                              {producto.cuotas8 && (
                                <div className="small text-muted">
                                  ${parseFloat(producto.cuotas8).toLocaleString('es-CO')} /mes
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>

                        {/* Badges/Etiquetas */}
                        <td className="align-middle">
                          <div className="d-flex flex-column gap-1">
                            {producto.promo && (producto.badgeMode === 'promo' || producto.badgeMode === 'ambos') && (
                              <Badge
                                bg="danger"
                                style={{
                                  backgroundColor: producto.promoBadgeBg || '#d81b60',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {producto.promoBadgeText || 'PROMO'}
                              </Badge>
                            )}
                            {producto.nuevo && (producto.badgeMode === 'nuevo' || producto.badgeMode === 'ambos') && (
                              <Badge
                                bg="success"
                                style={{
                                  backgroundColor: producto.nuevoBadgeBg || '#28a745',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {producto.nuevoBadgeText || 'NUEVO'}
                              </Badge>
                            )}
                            {(!producto.promo && !producto.nuevo) || producto.badgeMode === 'none' ? (
                              <span className="text-muted small">-</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="align-middle">
                          <div className="d-flex gap-2">
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleEditProducto(producto)}
                              style={{ minWidth: '70px' }}
                            >
                              ✏️ Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteProducto(producto.id)}
                              style={{ minWidth: '80px' }}
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>

              {/* Mensaje cuando no hay resultados */}
              {productos.filter(producto => {
                if (!searchProducto) return true;
                const searchLower = searchProducto.toLowerCase();
                const nombre = (producto.nombre || '').toLowerCase();
                const descripcion = (producto.descripcion || '').toLowerCase();
                return nombre.includes(searchLower) || descripcion.includes(searchLower);
              }).length === 0 && (
                  <div className="text-center py-4 text-muted">
                    <p className="mb-0">
                      {searchProducto
                        ? `No se encontraron productos que coincidan con "${searchProducto}"`
                        : 'No hay productos registrados'
                      }
                    </p>
                  </div>
                )}
            </div>
          </Card>
        </Tab>

        {/* === Configuración del Negocio === */}
        <Tab eventKey="negocio" title="Configuración del Negocio">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Configuración del Negocio</h3>
            <Form onSubmit={(e) => { e.preventDefault(); handleUpdateConfig(); }}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Negocio</Form.Label>
                    <Form.Control type="text" value={nombreNegocio} onChange={e => setNombreNegocio(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Logo del Negocio</Form.Label>
                    <Form.Control type="file" onChange={handleLogoChange} />
                    {previewLogo && <img src={previewLogo} alt="Preview Logo" style={{ height: '80px', marginTop: '10px' }} className="d-block" />}
                  </Form.Group>
                </Col>
              </Row>

              {/* === Tema de temporada (sin tocar código) === */}
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
                    <Form.Control type="datetime-local" value={themeStart} onChange={(e) => setThemeStart(e.target.value)} />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Fin (opcional)</Form.Label>
                    <Form.Control type="datetime-local" value={themeEnd} onChange={(e) => setThemeEnd(e.target.value)} />
                  </Col>

                  {/* Variables CSS clave para promos */}
                  <Col md={4}>
                    <Form.Label>Color badge promo</Form.Label>
                    <Form.Control type="color"
                      value={themeVars['--promo-badge-bg'] || '#d81b60'}
                      onChange={(e) => setThemeVars(v => ({ ...v, ['--promo-badge-bg']: e.target.value }))}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Texto badge promo</Form.Label>
                    <Form.Control type="color"
                      value={themeVars['--promo-badge-text'] || '#ffffff'}
                      onChange={(e) => setThemeVars(v => ({ ...v, ['--promo-badge-text']: e.target.value }))}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Resaltado tarjetas</Form.Label>
                    <Form.Control
                      value={themeVars['--promo-highlight'] || 'rgba(216,27,96,.18)'}
                      onChange={(e) => setThemeVars(v => ({ ...v, ['--promo-highlight']: e.target.value }))}
                    />
                  </Col>
                </Row>

                <div className="d-flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" onClick={() => setThemeVars(v => ({
                    ...v,
                    '--promo-badge-bg': '#d81b60',
                    '--promo-badge-text': '#ffffff',
                    '--promo-highlight': 'rgba(216,27,96,.18)',
                    '--theme-name': 'valentine'
                  }))}>
                    💘 Amor y Amistad
                  </Button>
                  <Button size="sm" variant="success" onClick={() => setThemeVars(v => ({
                    ...v,
                    '--promo-badge-bg': '#2e7d32',
                    '--promo-badge-text': '#ffffff',
                    '--promo-highlight': 'rgba(46,125,50,.18)',
                    '--theme-name': 'christmas'
                  }))}>
                    🎄 Navidad
                  </Button>
                  <Button size="sm" variant="warning" onClick={() => setThemeVars(v => ({
                    ...v,
                    '--promo-badge-bg': '#ff6d00',
                    '--promo-badge-text': '#1b1b1b',
                    '--promo-highlight': 'rgba(255,109,0,.18)',
                    '--theme-name': 'halloween'
                  }))}>
                    🎃 Halloween
                  </Button>
                </div>
              </Card>

              <Button variant="primary" type="submit">Actualizar Configuración</Button>
            </Form>
          </Card>
        </Tab>

        {/* === Asesores === */}
        <Tab eventKey="asesores" title="Gestionar Asesores">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">{editandoAsesor ? 'Editar Asesor' : 'Registrar Nuevo Asesor'}</h3>
            <Form onSubmit={editandoAsesor ? handleUpdateAsesor : handleAddAsesor}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre Completo</Form.Label>
                <Form.Control type="text" value={nombreCompletoAsesor} onChange={e => setNombreCompletoAsesor(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={emailAsesor} onChange={e => setEmailAsesor(e.target.value)} required disabled={!!editandoAsesor} />
              </Form.Group>
              {!editandoAsesor && (
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control type="password" value={passwordAsesor} onChange={e => setPasswordAsesor(e.target.value)} required />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Número de WhatsApp</Form.Label>
                <Form.Control type="text" value={whatsappAsesor} onChange={e => setWhatsappAsesor(e.target.value)} placeholder="Ej: 573XXYYYYYYY" required />
              </Form.Group>
              <Button variant="primary" type="submit" className="me-2">
                {editandoAsesor ? 'Actualizar Asesor' : 'Registrar Asesor'}
              </Button>
              {editandoAsesor && (
                <Button variant="secondary" onClick={() => {
                  setEditandoAsesor(null);
                  setEmailAsesor('');
                  setNombreCompletoAsesor('');
                  setWhatsappAsesor('');
                  setPasswordAsesor('');
                }}>
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
                {asesores.map(asesor => (
                  <tr key={asesor.id}>
                    <td>{asesor.nombreCompleto}</td>
                    <td>{asesor.email}</td>
                    <td>{asesor.whatsappNumber}</td>
                    <td>{asesor.rol}</td>
                    <td>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleEditAsesor(asesor)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteAsesor(asesor.id)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Tab>

        {/* === Carrusel Hero === */}
        <Tab eventKey="carrusel" title="Carrusel Hero">
          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">{editandoSlide ? 'Editar Slide' : 'Agregar Nuevo Slide'}</h3>
            <Form onSubmit={handleSubmitSlide}>
              <Form.Group className="mb-3">
                <Form.Label>URL de la Imagen</Form.Label>
                <Form.Control
                  type="text"
                  value={urlImagenSlide}
                  onChange={e => handleUrlImagenChange(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  required
                />
                <Form.Text className="text-muted">
                  Ingresa la URL completa de la imagen (debe comenzar con http:// o https://)
                </Form.Text>
              </Form.Group>

              {/* Vista previa de la imagen */}
              {previewImagenSlide && (
                <div className="mb-3">
                  <Form.Label>Vista Previa</Form.Label>
                  <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '200px',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <img
                      src={previewImagenSlide}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6c757d;">Error al cargar la imagen</div>';
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
                  onChange={e => setTituloSlide(e.target.value)}
                  placeholder="Ej: ¡Ofertas Especiales!"
                />
                <Form.Text className="text-muted">
                  Este texto se mostrará sobre la imagen con fondo oscuro para mejor legibilidad
                </Form.Text>
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Orden de Visualización</Form.Label>
                    <Form.Control
                      type="number"
                      value={ordenSlide}
                      onChange={e => setOrdenSlide(e.target.value)}
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
                {editandoSlide ? 'Actualizar Slide' : 'Agregar Slide'}
              </Button>
              {editandoSlide && (
                <Button variant="secondary" onClick={resetSlideForm}>Cancelar Edición</Button>
              )}
            </Form>
          </Card>

          <Card className="p-4 mb-4 shadow-sm">
            <h3 className="mb-3">Slides del Carrusel</h3>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: '100px' }}>Imagen</th>
                    <th>Título</th>
                    <th style={{ width: '80px' }}>Orden</th>
                    <th style={{ width: '100px' }}>Estado</th>
                    <th style={{ width: '250px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {slides
                    .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                    .map(slide => (
                      <tr key={slide.id}>
                        <td className="text-center align-middle">
                          <img
                            src={slide.url_imagen || "https://via.placeholder.com/80"}
                            alt={slide.titulo || "Slide"}
                            style={{
                              width: '80px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        </td>
                        <td className="align-middle">
                          {slide.titulo || <span className="text-muted">Sin título</span>}
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
                  <p className="mb-0">No hay slides registrados. Agrega el primero arriba.</p>
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