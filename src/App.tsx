import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, ChevronRight, X, Trash2, Utensils, Facebook, MapPin, Loader2, Gift, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchSheetData, submitSheetData, SheetDish, SheetCategory, SHEET_ID } from './services/googleSheets';
import { DEFAULT_MENU_DATA, Dish, Category, Addon } from './data/menuData';

// ==========================================
// 📋 CONFIGURACIÓN DE LA PLANTILLA DEL MENÚ
// ==========================================
const RESTAURANTE_NAME = "MCT FOODS";
const RESTAURANTE_SLOGAN = "Frescura, Sostenibilidad y Alta Calidad";
const WHATSAPP_NUMBER = "51900000000"; // Reemplaza con tu número de WhatsApp
const FACEBOOK_URL = ""; 
const MAPS_URL = ""; 
const LOGO_FOOTER_PATH = ""; 
const BANNER_PATH = ""; 
const MARQUEE_TEXT = "🌿 MCT FOODS • FRESCO, NATURAL Y EXCLUSIVO • REALIZA TU PEDIDO POR WHATSAPP • ";
// ==========================================

const LOCAL_IMAGES: Record<string, string> = {};

interface CartItem {
  nombre: string;
  precio: string;
  cantidad: number;
  opcionSeleccionada?: string;
  adicionalesSeleccionados?: Addon[];
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Customization modal states
  const [customizingDish, setCustomizingDish] = useState<Dish | null>(null);
  const [selectedOpcion, setSelectedOpcion] = useState<string>('');
  const [selectedAdicionales, setSelectedAdicionales] = useState<Record<string, boolean>>({});

  // States for Birthday Form
  const [showBirthdayForm, setShowBirthdayForm] = useState(false);
  const [isSubmittingBirthday, setIsSubmittingBirthday] = useState(false);
  const [birthdaySuccess, setBirthdaySuccess] = useState(false);
  const [birthdayData, setBirthdayData] = useState({
    nombre: '',
    telefono: '',
    fechaNacimiento: '',
    distrito: '',
    correo: ''
  });

  // States for Review Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewData, setReviewData] = useState({
    estrellasMozo: 0,
    estrellasComida: 0,
    comentario: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!SHEET_ID) {
          setCategories(DEFAULT_MENU_DATA);
          if (DEFAULT_MENU_DATA.length > 0) {
            setActiveCategory(DEFAULT_MENU_DATA[0].id);
          }
          return;
        }

        const [cats, dishes] = await Promise.all([
          fetchSheetData<SheetCategory>('Categorías'),
          fetchSheetData<SheetDish>('Platos')
        ]);

        if (cats.length === 0 && dishes.length === 0) {
          setCategories(DEFAULT_MENU_DATA);
          if (DEFAULT_MENU_DATA.length > 0) {
            setActiveCategory(DEFAULT_MENU_DATA[0].id);
          }
          return;
        }

        const formattedCategories: Category[] = cats.map(c => ({
          id: c.nombre.toLowerCase().replace(/\s+/g, '-'),
          nombre: c.nombre,
          items: dishes
            .filter(d => d.categoría === c.nombre)
            .map(d => ({
              nombre: d['nombre del plato'],
              descripcion: d.descripción,
              precio: d.precio,
              imagen: LOCAL_IMAGES[d['nombre del plato']] || d['URL de imagen'] || null
            }))
        }));

        setCategories(formattedCategories);
        if (formattedCategories.length > 0) {
          setActiveCategory(formattedCategories[0].id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setCategories(DEFAULT_MENU_DATA);
        if (DEFAULT_MENU_DATA.length > 0) {
          setActiveCategory(DEFAULT_MENU_DATA[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.cantidad, 0), [cart]);

  const areAdicionalesEqual = (a?: Addon[], b?: Addon[]) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const aNames = a.map(x => x.nombre).sort();
    const bNames = b.map(x => x.nombre).sort();
    return aNames.every((val, index) => val === bNames[index]);
  };

  const addToCart = (dish: Dish) => {
    if (dish.opciones || dish.adicionales) {
      setCustomizingDish(dish);
      setSelectedOpcion(dish.opciones ? dish.opciones[0] : '');
      setSelectedAdicionales({});
    } else {
      confirmAddToCart(dish);
    }
  };

  const confirmAddToCart = (dish: Dish, opcion?: string, adicionales?: Addon[]) => {
    setCart(prev => {
      const existing = prev.find(i => 
        i.nombre === dish.nombre && 
        i.precio === dish.precio &&
        i.opcionSeleccionada === opcion &&
        areAdicionalesEqual(i.adicionalesSeleccionados, adicionales)
      );
      if (existing) {
        return prev.map(i =>
          (i.nombre === dish.nombre && i.precio === dish.precio && i.opcionSeleccionada === opcion && areAdicionalesEqual(i.adicionalesSeleccionados, adicionales))
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { 
        nombre: dish.nombre, 
        precio: dish.precio, 
        cantidad: 1, 
        opcionSeleccionada: opcion, 
        adicionalesSeleccionados: adicionales 
      }];
    });
    setCustomizingDish(null);
  };

  const updateQuantity = (nombre: string, precio: string, opcionSeleccionada?: string, adicionalesSeleccionados?: Addon[], delta: number = 0) => {
    setCart(prev =>
      prev
        .map(i => {
          if (
            i.nombre === nombre && 
            i.precio === precio && 
            i.opcionSeleccionada === opcionSeleccionada && 
            areAdicionalesEqual(i.adicionalesSeleccionados, adicionalesSeleccionados)
          ) {
            const newQty = i.cantidad + delta;
            return newQty > 0 ? { ...i, cantidad: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => {
      const cleanPrice = item.precio.replace(/^[^\d]*/, '');
      const baseNum = parseFloat(cleanPrice) || 0;
      const addonsNum = item.adicionalesSeleccionados?.reduce((sum, add) => sum + add.precio, 0) || 0;
      return acc + (baseNum + addonsNum) * item.cantidad;
    }, 0);
  };

  const sendToWhatsApp = () => {
    const total = calculateTotal();
    let message = `*Hola MCT FOODS, deseo realizar un pedido:*\n\n`;
    cart.forEach(item => {
      let details = "";
      if (item.opcionSeleccionada) {
        details += ` (${item.opcionSeleccionada})`;
      }
      if (item.adicionalesSeleccionados && item.adicionalesSeleccionados.length > 0) {
        const extraNames = item.adicionalesSeleccionados.map(a => `${a.nombre} (+S/.${a.precio.toFixed(2)})`).join(', ');
        details += ` [Extras: ${extraNames}]`;
      }
      
      const itemBasePrice = parseFloat(item.precio.replace(/^[^\d]*/, '')) || 0;
      const itemAddonsPrice = item.adicionalesSeleccionados?.reduce((sum, a) => sum + a.precio, 0) || 0;
      const unitTotal = itemBasePrice + itemAddonsPrice;
      
      message += `• ${item.cantidad} x ${item.nombre}${details} (S/.${unitTotal.toFixed(2)} c/u)\n`;
    });
    message += `\n*TOTAL: S/.${total.toFixed(2)}*`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBirthdaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBirthday(true);
    const success = await submitSheetData('Cumpleaños', {
      timestamp: new Date().toLocaleString('es-PE'),
      nombre: birthdayData.nombre,
      telefono: birthdayData.telefono,
      fechaNacimiento: birthdayData.fechaNacimiento,
      distrito: birthdayData.distrito,
      correo: birthdayData.correo || 'No indicado'
    });
    
    setIsSubmittingBirthday(false);
    if (success) {
      setBirthdaySuccess(true);
      setTimeout(() => {
        setShowBirthdayForm(false);
        setBirthdaySuccess(false);
        setBirthdayData({ nombre: '', telefono: '', fechaNacimiento: '', distrito: '', correo: '' });
      }, 3000);
    } else {
      alert("Hubo un error al enviar tus datos. Por favor, inténtalo de nuevo.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewData.estrellasMozo === 0 || reviewData.estrellasComida === 0) {
      alert("Por favor califica ambas opciones con estrellas.");
      return;
    }

    setIsSubmittingReview(true);
    const success = await submitSheetData('Reseñas', {
      timestamp: new Date().toLocaleString('es-PE'),
      estrellasMozo: reviewData.estrellasMozo,
      estrellasComida: reviewData.estrellasComida,
      comentario: reviewData.comentario || 'Sin comentarios'
    });
    
    setIsSubmittingReview(false);
    if (success) {
      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewSuccess(false);
        setReviewData({ estrellasMozo: 0, estrellasComida: 0, comentario: '' });
      }, 3000);
    } else {
      alert("Hubo un error al enviar tu reseña. Por favor, inténtalo de nuevo.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F0F10]">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-slogan text-primary font-bold tracking-widest uppercase text-xs">Cargando delicias...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[#0F0F10] min-h-screen relative shadow-2xl overflow-hidden flex flex-col font-sans text-white border-x border-[#2A2A2E]">
      
      {/* Header */}
      <header className="sticky top-0 bg-[#0F0F10]/95 backdrop-blur-md z-50 px-5 py-4 flex justify-between items-center border-b border-[#2A2A2E]">
        <div className="flex flex-col items-start">
          <h1 className="font-title text-[24px] font-black text-primary leading-none tracking-wider">{RESTAURANTE_NAME}</h1>
          <span className="font-slogan text-[10px] text-secondary font-bold tracking-widest mt-1 uppercase">{RESTAURANTE_SLOGAN}</span>
        </div>
        <div className="flex items-center gap-2">
          {FACEBOOK_URL && (
            <motion.a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary cursor-pointer border border-primary/20"
            >
              <Facebook size={20} />
            </motion.a>
          )}
          {MAPS_URL && (
            <motion.a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary cursor-pointer border border-primary/20"
            >
              <MapPin size={20} />
            </motion.a>
          )}
          <motion.div
            onClick={() => cartCount > 0 && setShowSummary(true)}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center relative cursor-pointer border border-primary/20"
          >
            <ShoppingBag size={20} className="text-primary" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-4.5 bg-secondary text-black rounded-full text-[9px] font-extrabold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </motion.div>
        </div>
      </header>

      {/* Marquee */}
      <div className="w-full bg-primary py-1.5 overflow-hidden flex items-center">
        <div className="animate-marquee flex gap-6 text-black font-slogan font-extrabold text-[10px] tracking-widest uppercase whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i}>{MARQUEE_TEXT}</span>
          ))}
        </div>
      </div>

      {/* Birthday Promo */}
      <div className="px-5 pt-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: ["0px 0px 0px 0px rgba(212,175,55,0.4)", "0px 0px 20px 8px rgba(212,175,55,0)", "0px 0px 0px 0px rgba(212,175,55,0)"] 
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={() => setShowBirthdayForm(true)}
          className="w-full bg-gradient-to-r from-primary via-secondary to-primary text-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-wide border border-primary/40 relative overflow-hidden group text-center"
        >
          <div className="absolute inset-0 shimmer opacity-20 mix-blend-overlay"></div>
          <Gift size={16} className="animate-bounce shrink-0" />
          <span>¡Celebra tu cumpleaños con nosotros! 🌿 <span className="underline font-black">Regístrate aquí</span> y llévate un batido saludable de cortesía. 🥤🎁</span>
        </motion.button>
      </div>

      {/* 3D realistic logo banner */}
      <div className="px-5 pt-4 pb-3">
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl aspect-[2/1] bg-gradient-to-br from-[#161618] to-[#0A0A0B] flex flex-col items-center justify-center text-center p-6 border border-[#D4AF37]/20">
          <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-[#D4AF37] opacity-80"></div>
              <svg className="w-16 h-16 filter drop-shadow-[0_4px_10px_rgba(212,175,55,0.3)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gold-emblem" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#AA771C" />
                    <stop offset="25%" stopColor="#F3E5AB" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="75%" stopColor="#F3E5AB" />
                    <stop offset="100%" stopColor="#AA771C" />
                  </linearGradient>
                  <linearGradient id="emerald-emblem" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#064E3B" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
                  </filter>
                </defs>
                <path d="M 62 25 C 42 25, 32 36, 32 50 C 32 64, 42 75, 62 75" stroke="url(#gold-emblem)" strokeWidth="10" strokeLinecap="round" fill="none" filter="url(#shadow)" />
                <path d="M 45 50 C 45 35, 62 30, 65 30 C 65 45, 55 65, 45 50 Z" fill="url(#emerald-emblem)" stroke="url(#gold-emblem)" strokeWidth="2" filter="url(#shadow)" />
                <path d="M 45 50 C 53 43, 61 38, 65 30" stroke="url(#gold-emblem)" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-[#D4AF37] opacity-80"></div>
            </div>
            <h2 className="font-title text-[32px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#D4AF37] to-[#10B981] tracking-wide mt-2 leading-none uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              MCT
            </h2>
            <span className="font-slogan text-[12px] text-[#D4AF37] tracking-[0.4em] font-medium uppercase mt-1">
              FOODS
            </span>
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="px-5 py-3 overflow-x-auto no-scrollbar bg-[#0F0F10]">
        <div className="flex gap-2 w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-[11px] font-category font-semibold whitespace-nowrap transition-all duration-200 border
                ${activeCategory === cat.id
                  ? 'bg-primary text-black border-primary shadow-md shadow-primary/20'
                  : 'bg-[#1A1A1C] text-white border-[#2A2A2E] hover:border-primary/40 hover:text-primary'
                }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items listing */}
      <main className="flex-1 overflow-y-auto pb-32 px-5">
        {categories.map(cat => (
          <section key={cat.id} id={`cat-${cat.id}`} className="mb-10 scroll-mt-28">
            <div className="mb-5 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <Utensils className="text-secondary wave-icon" size={20} />
                <h3 className="font-category font-semibold text-white text-[24px] leading-none tracking-wide category-underline">
                  {cat.nombre}
                </h3>
              </div>
            </div>

            {/* Special display for Menú del Día */}
            {cat.id === 'menu-del-dia' ? (
              <div className="bg-gradient-to-br from-[#1A1A1C] to-[#252528] rounded-[2rem] border border-primary/30 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-black font-extrabold text-[9px] uppercase px-4 py-1.5 rounded-bl-2xl tracking-widest shadow-md">
                  Oferta del Día
                </div>
                {cat.items.map((dish, idx) => (
                  <div key={idx} className="flex flex-col gap-4">
                    <div>
                      <h4 className="font-title text-[20px] font-bold text-primary mb-2 leading-tight">
                        {dish.nombre}
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed mb-4">
                        {dish.descripcion}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#2A2A2E] pt-4 mt-2">
                      <span className="font-title font-black text-2xl text-secondary">
                        {dish.precio}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addToCart(dish)}
                        className="bg-primary hover:bg-primary/95 text-black px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <Plus size={16} />
                        Pedir Menú
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {cat.items.map((dish, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4 }}
                    className="bg-[#1A1A1C] rounded-[2rem] overflow-hidden flex flex-col shadow-sm border border-[#2A2A2E] hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  >
                    <div className="bg-[#242428] aspect-square flex items-center justify-center relative overflow-hidden p-4 border-b border-[#2A2A2E]">
                      <span className="font-dish font-bold text-[10px] text-[#D4AF37] uppercase tracking-wider text-center flex flex-col items-center gap-1.5">
                        <Utensils size={24} className="opacity-40" />
                        MCT FOODS
                      </span>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="font-dish font-bold text-white text-[13px] leading-tight mb-1">
                        {dish.nombre}
                      </h4>
                      {dish.descripcion && (
                        <p className="text-[10px] text-gray-400 leading-tight mb-2 line-clamp-3">
                          {dish.descripcion}
                        </p>
                      )}
                      {dish.acompanamiento && (
                        <span className="text-[9px] text-secondary font-bold uppercase tracking-wider mt-1 mb-2">
                          🥗 Acomp: {dish.acompanamiento}
                        </span>
                      )}
                      <div className="flex-1"></div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-dish font-bold text-primary text-[15px] whitespace-nowrap">
                          {dish.precio}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => addToCart(dish)}
                          className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 hover:bg-primary hover:text-black transition-colors duration-200 shrink-0"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Review Promo Section */}
        <section className="mt-8 mb-4 border border-[#2A2A2E] bg-[#1A1A1C] rounded-3xl p-5 text-center shadow-sm">
          <h3 className="font-title text-primary text-[20px] leading-tight mb-1.5">¿Cómo estuvo todo?</h3>
          <p className="text-[11px] text-gray-400 mb-4 px-4">Ayúdanos a mejorar calificando tu experiencia con nosotros</p>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReviewForm(true)}
            className="bg-primary text-black px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 mx-auto w-full"
          >
            <Star size={18} className="fill-black" />
            Reseña nuestra comida
          </motion.button>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-8 pb-10 border-t border-[#2A2A2E] flex flex-col items-center justify-center">
          <p className="font-title text-xl text-primary font-black mb-3">{RESTAURANTE_NAME}</p>
          <div className="relative w-24 h-24 mb-6 rounded-2xl border border-dashed border-primary/30 bg-[#1A1A1C] flex items-center justify-center text-center p-2">
            <svg className="w-12 h-12 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.2)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 62 25 C 42 25, 32 36, 32 50 C 32 64, 42 75, 62 75" stroke="#D4AF37" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M 45 50 C 45 35, 62 30, 65 30 C 65 45, 55 65, 45 50 Z" fill="#10B981" stroke="#D4AF37" strokeWidth="2" />
            </svg>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">© 2026 Todos los derechos reservados.</p>
        </footer>

        {/* Powered by */}
        <div className="bg-[#0B0B0C] py-6 flex flex-col items-center justify-center border-t border-[#2A2A2E] -mx-5 px-5">
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1 opacity-50 text-white/50">Digital Menu Experience</p>
          <motion.a 
            href="https://tymasolutions.lat/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-xs tracking-tight group cursor-pointer"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-white group-hover:text-primary transition-colors duration-200">Hecho por Tyma</span>
            <span className="text-primary group-hover:text-white transition-colors duration-200">Solutions</span>
          </motion.a>
        </div>
      </main>

      {/* Floating Cart Button Preview */}
      <AnimatePresence>
        {cartCount > 0 && !showSummary && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 w-full max-w-md p-5 z-40"
          >
            <div className="glass rounded-[2rem] p-4 flex items-center justify-between border border-white/10 shadow-2xl bg-[#1A1A1C]/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="shimmer absolute inset-0 opacity-20"></div>
                  <ShoppingBag size={20} className="text-black" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tu Pedido</p>
                  <p className="font-bold text-white text-md">{cartCount} Artículos</p>
                </div>
              </div>
              <button
                onClick={() => setShowSummary(true)}
                className="bg-primary text-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 font-bold text-xs uppercase tracking-wide"
              >
                Ver Pedido
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cart Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4 lg:p-0"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-[#1A1A1C] border-t border-[#2A2A2E] w-full max-w-md rounded-t-[3rem] p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-title text-2xl font-black text-primary">Mi Pedido</h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="w-10 h-10 bg-[#252528] rounded-full flex items-center justify-center border border-[#333338]"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3 mb-8">
                {cart.map((item, idx) => {
                  const itemBasePrice = parseFloat(item.precio.replace(/^[^\d]*/, '')) || 0;
                  const itemAddonsPrice = item.adicionalesSeleccionados?.reduce((sum, a) => sum + a.precio, 0) || 0;
                  const unitPrice = itemBasePrice + itemAddonsPrice;
                  
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-[#252528] p-4 rounded-2xl border border-[#333338]"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-dish font-semibold text-white text-sm truncate">{item.nombre}</h4>
                        {item.opcionSeleccionada && (
                          <p className="text-[10px] text-secondary font-bold uppercase mt-0.5">Parte: {item.opcionSeleccionada}</p>
                        )}
                        {item.adicionalesSeleccionados && item.adicionalesSeleccionados.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            + {item.adicionalesSeleccionados.map(a => a.nombre).join(', ')}
                          </p>
                        )}
                        <p className="font-dish text-xs text-primary font-bold mt-1">S/.{unitPrice.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-3 bg-[#1A1A1C] px-3 py-1.5 rounded-xl border border-[#2A2A2E]">
                        <button onClick={() => updateQuantity(item.nombre, item.precio, item.opcionSeleccionada, item.adicionalesSeleccionados, -1)} className="text-gray-400">
                          <Minus size={14} />
                        </button>
                        <span className="font-dish font-bold text-sm w-4 text-center text-white">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.nombre, item.precio, item.opcionSeleccionada, item.adicionalesSeleccionados, 1)} className="text-primary">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => updateQuantity(item.nombre, item.precio, item.opcionSeleccionada, item.adicionalesSeleccionados, -item.cantidad)}
                        className="text-red-400 ml-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-dashed border-[#333338] pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <h3 className="font-dish text-lg font-bold text-white">Total a pagar</h3>
                  <h3 className="font-dish text-xl font-bold text-secondary">S/.{calculateTotal().toFixed(2)}</h3>
                </div>
              </div>
              <button
                onClick={sendToWhatsApp}
                className="w-full bg-[#25D366] text-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-green-900/10 hover:scale-[1.02] transition-transform font-bold text-sm"
              >
                Enviar Pedido a WhatsApp
                <ChevronRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dish Customization Modal */}
      <AnimatePresence>
        {customizingDish && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1A1C] border border-[#2A2A2E] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setCustomizingDish(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-[#252528] rounded-full flex items-center justify-center border border-[#333338]"
              >
                <X size={18} className="text-gray-400" />
              </button>

              <h3 className="font-title text-lg font-bold text-primary mb-1 pr-6">{customizingDish.nombre}</h3>
              <p className="text-xs text-gray-400 mb-4">{customizingDish.descripcion}</p>

              {/* Options selection (variants) */}
              {customizingDish.opciones && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selecciona una opción</p>
                  <div className="flex gap-2">
                    {customizingDish.opciones.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedOpcion(opt)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedOpcion === opt 
                            ? 'bg-primary text-black border-primary' 
                            : 'bg-[#252528] text-white border-[#333338] hover:border-gray-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons selection */}
              {customizingDish.adicionales && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">¿Deseas agregar adicionales?</p>
                  <div className="space-y-2">
                    {customizingDish.adicionales.map(add => (
                      <button
                        key={add.nombre}
                        type="button"
                        onClick={() => {
                          setSelectedAdicionales(prev => ({
                            ...prev,
                            [add.nombre]: !prev[add.nombre]
                          }));
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedAdicionales[add.nombre]
                            ? 'bg-secondary/10 border-secondary text-secondary'
                            : 'bg-[#252528] border-[#333338] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            selectedAdicionales[add.nombre] ? 'bg-secondary border-secondary text-black' : 'border-gray-500'
                          }`}>
                            {selectedAdicionales[add.nombre] && <Check size={10} strokeWidth={4} />}
                          </div>
                          <span>{add.nombre}</span>
                        </div>
                        <span>+ S/.{add.precio.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const adds = customizingDish.adicionales?.filter(a => selectedAdicionales[a.nombre]) || [];
                  confirmAddToCart(customizingDish, selectedOpcion, adds);
                }}
                className="w-full bg-primary text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
              >
                Agregar al Pedido
                <ChevronRight size={14} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Birthday Registration Modal */}
      <AnimatePresence>
        {showBirthdayForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1A1A1C] border border-[#2A2A2E] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowBirthdayForm(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-[#252528] rounded-full flex items-center justify-center border border-[#333338]"
              >
                <X size={18} className="text-gray-400" />
              </button>

              <div className="flex flex-col items-center text-center mb-5 mt-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 border border-primary/20">
                  <Gift size={24} className="text-primary" />
                </div>
                <h2 className="font-title text-xl font-bold text-white mb-1.5">¡Tu Cumpleaños!</h2>
                <p className="text-xs text-gray-400">Déjanos tus datos para enviarte una sorpresa en tu día especial.</p>
              </div>

              {birthdaySuccess ? (
                <div className="bg-secondary/10 text-secondary p-4 rounded-2xl text-center text-xs font-bold border border-secondary/20">
                  ¡Gracias! Tus datos han sido guardados.
                </div>
              ) : (
                <form onSubmit={handleBirthdaySubmit} className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Nombre Completo</label>
                    <input required type="text" value={birthdayData.nombre} onChange={e => setBirthdayData({...birthdayData, nombre: e.target.value})} className="w-full bg-[#252528] border border-[#333338] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="Ej. Juan Pérez" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Teléfono</label>
                    <input required type="tel" minLength={9} maxLength={11} pattern="[0-9]*" value={birthdayData.telefono} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setBirthdayData({...birthdayData, telefono: val});
                    }} className="w-full bg-[#252528] border border-[#333338] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="Ej. 987654321" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Fecha de Nacimiento</label>
                    <input required type="date" value={birthdayData.fechaNacimiento} onChange={e => setBirthdayData({...birthdayData, fechaNacimiento: e.target.value})} className="w-full bg-[#252528] border border-[#333338] rounded-xl px-4 py-2.5 text-xs text-gray-400 focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Distrito</label>
                    <input required type="text" value={birthdayData.distrito} onChange={e => setBirthdayData({...birthdayData, distrito: e.target.value})} className="w-full bg-[#252528] border border-[#333338] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="Ej. Miraflores" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Correo Electrónico (Opcional)</label>
                    <input type="email" value={birthdayData.correo} onChange={e => setBirthdayData({...birthdayData, correo: e.target.value})} className="w-full bg-[#252528] border border-[#333338] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors" placeholder="correo@ejemplo.com" />
                  </div>
                  
                  <button disabled={isSubmittingBirthday} type="submit" className="w-full bg-primary text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wide shadow-md shadow-primary/10 mt-2 disabled:opacity-70 flex justify-center items-center">
                    {isSubmittingBirthday ? <Loader2 size={16} className="animate-spin" /> : "Guardar mis datos"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Submission Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1A1A1C] border border-[#2A2A2E] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowReviewForm(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-[#252528] rounded-full flex items-center justify-center border border-[#333338]"
              >
                <X size={18} className="text-gray-400" />
              </button>

              <div className="flex flex-col items-center text-center mb-5 mt-2">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-3 border border-secondary/20">
                  <Star size={24} className="text-secondary fill-secondary" />
                </div>
                <h2 className="font-title text-xl font-bold text-white mb-1.5">¡Califícanos!</h2>
                <p className="text-xs text-gray-400">Tu opinión es muy importante para nosotros.</p>
              </div>

              {reviewSuccess ? (
                <div className="bg-secondary/10 text-secondary p-4 rounded-2xl text-center text-xs font-bold border border-secondary/20">
                  ¡Gracias por tu reseña! Nos ayuda a mejorar.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  
                  <div className="bg-[#252528] p-4 rounded-2xl border border-[#333338] flex flex-col items-center">
                    <p className="text-xs font-bold text-gray-300 mb-2">Atención del Mozo</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button 
                          key={star} type="button" 
                          onClick={() => setReviewData({...reviewData, estrellasMozo: star})}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star size={26} className={reviewData.estrellasMozo >= star ? "text-primary fill-primary" : "text-gray-600"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#252528] p-4 rounded-2xl border border-[#333338] flex flex-col items-center">
                    <p className="text-xs font-bold text-gray-300 mb-2">Calidad de la Comida</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button 
                          key={star} type="button" 
                          onClick={() => setReviewData({...reviewData, estrellasComida: star})}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star size={26} className={reviewData.estrellasComida >= star ? "text-primary fill-primary" : "text-gray-600"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Comentario (Opcional)</label>
                    <textarea 
                      rows={3} 
                      value={reviewData.comentario} 
                      onChange={e => setReviewData({...reviewData, comentario: e.target.value})} 
                      className="w-full bg-[#252528] border border-[#333338] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors resize-none mt-1" 
                      placeholder="Cuéntanos más sobre tu experiencia..." 
                    />
                  </div>
                  
                  <button disabled={isSubmittingReview} type="submit" className="w-full bg-primary text-black py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/10 mt-2 disabled:opacity-70 flex justify-center items-center">
                    {isSubmittingReview ? <Loader2 size={16} className="animate-spin" /> : "Enviar Reseña"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
