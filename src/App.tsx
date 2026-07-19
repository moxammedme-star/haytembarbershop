/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { LanguageSelector } from "./components/LanguageSelector";
import { BookingModal } from "./components/BookingModal";
import { AiConsultant } from "./components/AiConsultant";
import { AdminPanel } from "./components/AdminPanel";
import { CustomerDashboard } from "./components/CustomerDashboard";
import {
  Scissors,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Menu,
  X,
  Lock,
  MessageSquare,
  Check,
  Calendar,
  Heart,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function LandingPage() {
  const { db, currentLanguage, t, tText, user, toggleFavorite } = useApp();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");

  if (!db) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-pulse space-y-2">
          <span className="font-serif text-3xl tracking-[4px] font-light text-white block">HAYTEM</span>
          <span className="text-[10px] block tracking-[5px] opacity-60 text-white">BARBERSHOP</span>
        </div>
      </div>
    );
  }

  const isRtl = currentLanguage === "ar";

  // Group services by category for tabs
  const getCategories = () => {
    const cats = new Set(db.services.map((s) => s.category));
    return ["all", ...Array.from(cats)];
  };

  const categories = getCategories();

  // Filter services by active tab
  const filteredServices = db.services.filter((s) => {
    if (!s.availability) return false;
    if (activeCategoryFilter === "all") return true;
    return s.category === activeCategoryFilter;
  });

  const handleBookService = (serviceId: string) => {
    setPreselectedServiceId(serviceId);
    setIsBookingOpen(true);
  };

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Get current day highlight
  const todayIndex = new Date().getDay();
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thuesday", "friday", "saturday"];
  const currentDayKey = dayKeys[todayIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-white relative selection:bg-accent selection:text-black" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] bg-gradient-to-b from-neutral-950 to-[#050505] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-white/10 pointer-events-none" />

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-[#050505]/85 backdrop-blur-xl border-b border-white/10 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-start hover:opacity-80 transition-all text-left"
            id="header-logo-btn"
          >
            <span className="font-serif text-2xl tracking-[4px] font-light leading-none text-white">HAYTEM</span>
            <span className="text-[9px] tracking-[5px] opacity-60 text-white font-medium uppercase mt-0.5">BARBERSHOP</span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">
            <button onClick={() => handleNavClick("about")} className="hover:text-accent transition-colors duration-200">{t("nav_about") || "HAYTEM"}</button>
            <button onClick={() => handleNavClick("services")} className="hover:text-accent transition-colors duration-200">{t("nav_services") || "PRESTATIONS"}</button>
            <button onClick={() => handleNavClick("hairstyles")} className="hover:text-accent transition-colors duration-200">{t("nav_hairstyles") || "CATALOGUE"}</button>
            <button onClick={() => handleNavClick("gallery")} className="hover:text-accent transition-colors duration-200">{t("nav_gallery") || "GALERIE"}</button>
            <button onClick={() => handleNavClick("contact")} className="hover:text-accent transition-colors duration-200">{t("nav_contact") || "ACCÈS"}</button>
          </nav>

          {/* Right side selectors */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageSelector />
            <button
              onClick={() => setIsDashboardOpen(true)}
              className="inline-flex items-center space-x-2 border border-white/10 hover:border-white/30 hover:text-white bg-[#0a0a0a] px-4 py-2.5 rounded-none text-xs text-neutral-300 font-bold uppercase tracking-[0.15em] transition-all duration-300 animate-fade-in"
            >
              <User className="w-3.5 h-3.5 text-accent" />
              <span>{user ? user.name.split(" ")[0].toUpperCase() : "MON ESPACE"}</span>
            </button>
            <button
              onClick={() => {
                setPreselectedServiceId(undefined);
                setIsBookingOpen(true);
              }}
              className="bg-white text-black hover:bg-transparent hover:text-white hover:border-white border border-transparent px-6 py-2.5 rounded-none text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300"
              id="header-book-btn"
            >
              {t("book_now") || "RÉSERVER"}
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center space-x-3 md:hidden">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-none border border-white/10 text-neutral-300"
              id="mobile-menu-trigger-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t border-white/10 bg-[#050505] p-6 space-y-6"
              id="mobile-navigation-panel"
            >
              <div className="flex flex-col space-y-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                <button onClick={() => handleNavClick("about")} className="text-left py-1 hover:text-accent">{t("nav_about") || "HAYTEM"}</button>
                <button onClick={() => handleNavClick("services")} className="text-left py-1 hover:text-accent">{t("nav_services") || "PRESTATIONS"}</button>
                <button onClick={() => handleNavClick("hairstyles")} className="text-left py-1 hover:text-accent">{t("nav_hairstyles") || "CATALOGUE"}</button>
                <button onClick={() => handleNavClick("gallery")} className="text-left py-1 hover:text-accent">{t("nav_gallery") || "GALERIE"}</button>
                <button onClick={() => handleNavClick("contact")} className="text-left py-1 hover:text-accent">{t("nav_contact") || "ACCÈS"}</button>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsDashboardOpen(true);
                  }}
                  className="w-full inline-flex justify-center items-center space-x-2 border border-white/10 hover:border-white/30 hover:text-white bg-[#0a0a0a] py-3 text-xs text-neutral-300 font-bold uppercase tracking-[0.2em] transition-all duration-300"
                >
                  <User className="w-3.5 h-3.5 text-accent" />
                  <span>{user ? `COMPTE : ${user.name.toUpperCase()}` : "MON ESPACE"}</span>
                </button>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsBookingOpen(true);
                  }}
                  className="w-full bg-white text-black hover:bg-transparent hover:text-white hover:border-white border border-transparent text-center py-3 rounded-none text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300"
                  id="mobile-book-btn"
                >
                  {t("book_now") || "RÉSERVER UN CRÉNEAU"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="min-h-screen flex items-center justify-center pt-24 px-6 relative overflow-hidden" id="hero-section">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(25,25,25,0.4),transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-none border border-white/10 bg-[#0a0a0a]/80 text-accent text-[10px] font-mono uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>ALGERIA'S PREMIER LUXURY BARBER EXPERIENCE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl md:text-8xl font-serif tracking-tight md:tracking-[-2px] uppercase leading-[0.95] text-white font-normal"
          >
            {t("hero_title") || "L'ART DE LA COUPE DE PRÉCISION"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-sm md:text-lg font-serif italic text-accent max-w-xl mx-auto"
          >
            {t("hero_subtitle") || "Vivez une expérience de coiffure sur mesure d'un standing international sous la signature de Haytem Mehazzem."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => {
                setPreselectedServiceId(undefined);
                setIsBookingOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black hover:bg-transparent hover:text-white border border-white px-8 py-4 rounded-none text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300"
              id="hero-booking-btn"
            >
              <Calendar className="w-4 h-4 mr-1" />
              <span>{t("book_now") || "PRENDRE RENDEZ-VOUS"}</span>
            </button>
            <button
              onClick={() => handleNavClick("hairstyles")}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 border border-white/10 hover:border-accent hover:text-accent hover:bg-white/5 px-8 py-4 rounded-none text-xs font-bold uppercase tracking-[0.2em] text-neutral-300 transition-all duration-300"
              id="hero-explore-btn"
            >
              <span>{t("explore_hairstyles") || "CATALOGUE DE STYLES"}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* PROMOTION BANNER */}
      {db.businessInfo.promotions && (
        <section className="py-8 bg-[#0a0a0a] border-y border-white/10 text-center px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[10px] border border-accent text-accent font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-none font-mono">OFFRE LIMITÉE</span>
            <p className="text-xs text-neutral-300 tracking-[0.05em] font-medium">{db.businessInfo.promotions}</p>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="text-xs text-accent hover:text-white hover:underline uppercase tracking-widest font-bold transition-colors"
            >
              Profiter de l'offre &rarr;
            </button>
          </div>
        </section>
      )}

      {/* BIOGRAPHY SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-white/10" id="about">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Story Content */}
          <div className="space-y-6">
            <span className="text-[10px] text-accent uppercase tracking-[0.25em] font-mono font-bold">
              {t("brand_story") || "PHILOSOPHIE DE MARQUE"}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-tight text-white leading-tight">
              HAYTEM MEHAZZEM &bull; LA SIGNATURE
            </h2>
            <div className="h-[1px] w-20 bg-accent" />
            <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line font-serif italic text-accent/80">
              {tText(db.businessInfo.biography) ||
                `HAYTEM BARBERSHOP est l'incarnation de la haute coiffure masculine internationale en Algérie. 
                Chaque détail est pensé pour sculpter votre signature visuelle unique avec un art méticuleux du dégradé, de la barbe et du soin de peau.`}
            </p>
          </div>

          {/* Aesthetic Bento-like details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 space-y-3 hover:border-accent/40 transition-all duration-300">
              <span className="text-xs font-mono font-bold text-accent">01 /</span>
              <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-white">DÉGRADÉS DE PRÉCISION</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Tapers, faders et rasages à blanc millimétrés adaptés aux contours exacts de votre visage.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 space-y-3 hover:border-accent/40 transition-all duration-300">
              <span className="text-xs font-mono font-bold text-accent">02 /</span>
              <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-white">SOINS BARBE DE LUXE</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Taille au rasoir droit traditionnel, serviette chaude et huiles essentielles nourrissantes.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 space-y-3 hover:border-accent/40 transition-all duration-300">
              <span className="text-xs font-mono font-bold text-accent">03 /</span>
              <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-white">ATMOSPHÈRE PRIVÉE</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Un environnement minimaliste chic, propice à la détente absolue d'un club de gentlemen.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 space-y-3 hover:border-accent/40 transition-all duration-300">
              <span className="text-xs font-mono font-bold text-accent">04 /</span>
              <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-white">STANDARDS ÉTRANGERS</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Utilisation exclusive de produits de soins capillaires professionnels haut de gamme.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-white/10" id="services">
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <span className="text-[10px] text-accent uppercase tracking-[0.25em] font-mono font-bold">
                {t("menu_pricing") || "TARIFS DES SOINS"}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-tight text-white leading-tight">
                NOS PRESTATIONS DE LUXE
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-4.5 py-2 rounded-none text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shrink-0 border ${
                    activeCategoryFilter === cat
                      ? "bg-white text-black border-white"
                      : "bg-[#0a0a0a] border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                  }`}
                >
                  {cat === "all" ? (currentLanguage === "fr" ? "TOUT" : currentLanguage === "ar" ? "الكل" : "ALL") : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 flex flex-col justify-between space-y-6 hover:border-accent/40 hover:translate-y-[-4px] transition-all duration-300 shadow-xl"
              >
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-accent">{srv.category}</span>
                  <h4 className="font-serif text-lg tracking-wide text-white pt-1">{tText(srv.title)}</h4>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{tText(srv.description)}</p>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-[0.15em] inline-block pt-1">
                    Durée : {srv.duration} min
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="font-serif text-base font-normal text-accent italic">
                    {srv.price ? `${srv.price} DZD` : t("price_on_request") || "SUR DEMANDE"}
                  </span>
                  <button
                    onClick={() => handleBookService(srv.id)}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-300 hover:text-accent transition-colors"
                  >
                    <span>RÉSERVER</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-accent" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HAIRSTYLES CATALOGUE SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-white/10" id="hairstyles">
        <div className="space-y-12">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-[10px] text-accent uppercase tracking-[0.25em] font-mono font-bold">
              {t("haircut_menu") || "HAIRSTYLES CATALOGUE"}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-tight text-white leading-tight">
              INSPIREZ-VOUS DE COUPES RÉELLES
            </h2>
            <p className="text-xs text-neutral-400 font-serif italic">
              Consultez nos styles les plus prisés. Sélectionnez la coupe souhaitée pour l'associer directement lors de votre réservation de créneau horaire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {db.hairstyles.map((hair) => {
              const isFav = user?.favorites?.includes(hair.id);
              return (
                <div
                  key={hair.id}
                  className="bg-[#0a0a0a] border border-white/10 rounded-none overflow-hidden shadow-xl flex flex-col justify-between hover:border-accent/45 hover:translate-y-[-4px] transition-all duration-300 relative group"
                >
                  <div className="h-48 bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative border-b border-white/10">
                    {hair.image ? (
                      <img src={hair.image} alt={tText(hair.name)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Scissors className="w-8 h-8 text-neutral-800 mx-auto mb-1.5" />
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Image en cours</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-[8px] uppercase tracking-[0.15em] bg-black/80 border border-white/10 text-accent px-2.5 py-0.5 rounded-none font-bold">
                      {hair.category}
                    </span>

                    {/* Heart button favorite toggle */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user) {
                          alert("Veuillez vous connecter à votre Espace Client pour sauvegarder vos coupes favorites.");
                          setIsDashboardOpen(true);
                          return;
                        }
                        await toggleFavorite(hair.id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-black border border-white/10 text-neutral-400 hover:text-red-500 transition cursor-pointer z-10"
                      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? "text-red-500 fill-red-500" : "text-neutral-400"}`} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-serif text-base uppercase tracking-wider text-white font-medium">{tText(hair.name)}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{tText(hair.description)}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>Durée: {hair.duration} min</span>
                      <span>Difficulté: {hair.difficulty}/5 ★</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="font-serif text-sm font-normal text-accent italic">
                        {hair.price ? `${hair.price} DZD` : "Non défini"}
                      </span>
                      <button
                        onClick={() => {
                          setPreselectedServiceId(undefined);
                          setIsBookingOpen(true);
                        }}
                        className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-300 hover:text-accent transition-colors"
                      >
                        Prendre ce style
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MEDIA SHOWCASE GALLERY SECTION */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-white/10" id="gallery">
        <div className="space-y-12">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-[10px] text-accent uppercase tracking-[0.25em] font-mono font-bold">
              {t("recent_looks") || "VISUAL MEDIA"}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-tight text-white leading-tight">
              PORTFOLIO DU SALON
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {db.gallery.map((g) => (
              <div
                key={g.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-none overflow-hidden shadow-xl aspect-square relative group hover:border-accent/45 transition-all duration-300"
              >
                {g.type === "image" ? (
                  <img src={g.url} alt="Gallery item" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                    <MessageSquare className="w-6 h-6 text-neutral-700" />
                  </div>
                )}
                <span className="absolute bottom-3 left-3 text-[8px] uppercase tracking-[0.15em] bg-black/80 border border-white/10 text-accent px-2.5 py-0.5 rounded-none font-bold">
                  {g.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT, LOCATION & WORK SCHEDULE */}
      <section className="py-24 max-w-7xl mx-auto px-6" id="contact">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Schedules and direct socials */}
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] text-accent uppercase tracking-[0.25em] font-mono font-bold">
                {t("business_hours") || "DÉTAILS D'ACCÈS"}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-tight text-white leading-tight">
                HORAIRES & PLAN
              </h2>
            </div>

            {/* Weekly opening config */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-none p-6 space-y-3">
              {db.workingHours.map((hour) => {
                const isToday = currentDayKey === hour.dayKey;
                return (
                  <div
                    key={hour.dayKey}
                    className={`flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-0 ${
                      isToday ? "text-accent font-bold" : "text-neutral-500"
                    }`}
                  >
                    <span className="uppercase tracking-wider">{hour.day}</span>
                    {hour.isClosed ? (
                      <span className="text-neutral-600 font-mono font-bold uppercase">{t("closed") || "FERMÉ"}</span>
                    ) : (
                      <span className="font-mono">
                        {hour.open} &bull; {hour.close}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Social channels and direct links */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#0a0a0a] border border-white/10 rounded-none">
              <div className="space-y-1">
                <h5 className="text-[10px] uppercase tracking-[0.15em] text-accent font-bold">Nous contacter par téléphone</h5>
                <p className="text-sm font-mono font-bold text-white">{db.businessInfo.phone}</p>
              </div>
              <div className="flex space-x-2.5">
                <a
                  href={db.businessInfo.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-none border border-white/10 text-neutral-400 hover:text-accent hover:border-accent hover:bg-white/5 transition-all duration-300"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={db.businessInfo.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-none border border-white/10 text-neutral-400 hover:text-accent hover:border-accent hover:bg-white/5 transition-all duration-300"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={db.businessInfo.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-none border border-white/10 text-neutral-400 hover:text-accent hover:border-accent hover:bg-white/5 transition-all duration-300"
                  title="TikTok"
                >
                  <Scissors className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Google maps embed */}
          <div className="h-[450px] bg-[#0a0a0a] border border-white/10 rounded-none overflow-hidden relative shadow-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.828030386114!2d6.1764101!3d35.5579308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12f40901e1da65ff%3A0xe543e34bca867ff4!2sCoiffeur%20Haytem!5e0!3m2!1sfr!2sdz!4v1700000000000!5m2!1sfr!2sdz"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(120%) opacity(0.85)" }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="p-8 border-t border-white/10 bg-[#0a0a0a] text-center text-[10px] text-neutral-600 uppercase tracking-[0.15em] font-mono space-y-4">
        <p>&copy; {new Date().getFullYear()} HAYTEM BARBERSHOP &bull; CRÉATION PREMIUM TOUS DROITS RÉSERVÉS</p>
        <p className="text-[9px] text-neutral-700">SALON DE COIFFURE ET SOIN DE PRESTIGE &bull; ALGER CENTRE, ALGER, ALGÉRIE</p>
        
        {/* Subtle lock link to enter administrator area */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "instant" });
              // Set the state parameter of parent component to 'admin'
              (window as any).__setAppView?.("admin");
            }}
            className="inline-flex items-center space-x-1 hover:text-accent hover:border-accent/40 transition-all text-[9px] border border-white/10 px-4 py-2 rounded-none uppercase tracking-[0.15em] bg-transparent text-neutral-400 font-bold"
            id="admin-portal-link"
          >
            <Lock className="w-3.5 h-3.5 mr-1" />
            <span>CONSOLE PRIVÉE</span>
          </button>
        </div>
      </footer>

      {/* FLOATING CHAT BUBBLE ASSISTANT */}
      <AiConsultant />

      {/* STEP-BY-STEP QUICK BOOKING MODAL FLOW */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedServiceId={preselectedServiceId}
      />

      {/* CUSTOMER AUTHENTICATION & DASHBOARD MODAL */}
      <AnimatePresence>
        {isDashboardOpen && (
          <CustomerDashboard
            onClose={() => setIsDashboardOpen(false)}
            openBooking={() => setIsBookingOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<"home" | "admin">("home");

  // Attach setView to window so footer portal link can bypass and route to admin
  React.useEffect(() => {
    (window as any).__setAppView = setView;
    return () => {
      delete (window as any).__setAppView;
    };
  }, []);

  return (
    <AppProvider>
      {view === "home" ? <LandingPage /> : <AdminPanel />}
    </AppProvider>
  );
}

