import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Lock,
  Unlock,
  Users,
  Calendar as CalIcon,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Sparkles,
  Clock,
  Phone,
  Image as ImgIcon,
  Globe,
  PlusCircle,
  FileText,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Bot,
  Download,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Service, Hairstyle, GalleryItem, Booking, WorkingHourDay } from "../types";

export const AdminPanel: React.FC = () => {
  const {
    db,
    stats,
    bookings,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    currentLanguage,
    tText,
    updateBookingStatus,
    updateBusinessInfo,
    updateWorkingHours,
    saveService,
    deleteService,
    saveHairstyle,
    deleteHairstyle,
    addGalleryItem,
    deleteGalleryItem,
    saveDictionary,
    deleteBooking,
    rescheduleBooking,
    createBooking
  } = useApp();

  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "bookings" | "services" | "hairstyles" | "gallery" | "schedule" | "dictionary" | "settings"
  >("overview");

  // Local state for edits
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [editingHairstyle, setEditingHairstyle] = useState<Partial<Hairstyle> | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [imageTarget, setImageTarget] = useState<"hairstyle" | "gallery">("hairstyle");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);

  // New gallery item state
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newGalleryCat, setNewGalleryCat] = useState("Coupe");
  const [newGalleryType, setNewGalleryType] = useState<"image" | "video">("image");

  // Search and Advanced Booking state
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualServiceId, setManualServiceId] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const handleAdminReschedule = async (bookingId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      alert("Veuillez renseigner la date et l'heure.");
      return;
    }
    const res = await rescheduleBooking(bookingId, rescheduleDate, rescheduleTime);
    if (res.success) {
      setReschedulingId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      alert("Rendez-vous reporté avec succès !");
    } else {
      alert(res.error || "Impossible de reporter ce rendez-vous (conflit de créneau).");
    }
  };

  const handleAddManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone || !manualServiceId || !manualDate || !manualTime) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }
    const success = await createBooking({
      customerName: manualName,
      customerPhone: manualPhone,
      serviceId: manualServiceId,
      date: manualDate,
      time: manualTime,
      status: "confirmed"
    });
    if (success) {
      setShowAddBookingModal(false);
      setManualName("");
      setManualPhone("");
      setManualServiceId("");
      setManualDate("");
      setManualTime("");
      alert("Réservation ajoutée avec succès !");
    } else {
      alert("Impossible de créer la réservation (conflit d'horaire ou erreur de saisie).");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Client", "Telephone", "Prestation", "Date", "Heure", "Statut", "Date Creation"];
    const filtered = bookings.filter(
      (b) =>
        (b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
          b.customerPhone.includes(bookingSearch)) &&
        (bookingStatusFilter === "all" || b.status === bookingStatusFilter)
    );
    const rows = filtered.map((b) => {
      const srv = db?.services.find((s) => s.id === b.serviceId);
      const title = srv ? tText(srv.title) : "Inconnu";
      return [
        b.id,
        `"${b.customerName.replace(/"/g, '""')}"`,
        `"${b.customerPhone}"`,
        `"${title.replace(/"/g, '""')}"`,
        b.date,
        b.time,
        b.status,
        b.createdAt || ""
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservations_haytem_barber_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintBookings = () => {
    window.print();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const success = await loginAdmin(passcode);
    if (!success) {
      setLoginError("Code d'accès incorrect. Veuillez réessayer.");
      setPasscode("");
    }
  };

  if (!db) return null;

  // Render passcode lock screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-none p-8 relative z-10 shadow-2xl shadow-black/80 text-center"
          id="admin-login-card"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#050505] rounded-none border border-white/10">
              <Lock className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h2 className="text-xl font-serif tracking-[0.2em] text-white uppercase font-bold">HAYTEM BARBER</h2>
          <p className="text-[10px] text-accent uppercase tracking-[0.15em] mt-1.5 font-mono">PORTAL DE GESTION PRIVÉ</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 font-bold font-mono">
                Code d'accès administrateur
              </label>
              <input
                type="password"
                placeholder="••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-4 text-center text-white text-lg font-mono focus:border-accent/40 focus:outline-none tracking-widest transition-all duration-300"
                id="admin-passcode-input"
              />
            </div>

            {loginError && <p className="text-xs text-red-500 mt-2 font-mono">{loginError}</p>}

            <button
              type="submit"
              className="w-full mt-2 bg-white hover:bg-transparent hover:text-white border border-white text-black py-4 rounded-none text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300"
              id="admin-login-submit-btn"
            >
              Déverrouiller la Console
            </button>
          </form>

          <button
            onClick={() => (window as any).__setAppView?.("home")}
            className="w-full mt-4 text-neutral-500 hover:text-accent transition-all text-xs font-bold uppercase tracking-[0.15em] py-3.5 border border-white/5 hover:border-accent/40 bg-[#050505] rounded-none cursor-pointer"
            id="admin-login-back-btn"
          >
            ← Retour au site public
          </button>
        </motion.div>
      </div>
    );
  }

  // Handle AI Image generation call
  const generateAiImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl("");
    try {
      const res = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          size: imageSize,
          aspectRatio: "1:1"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImageUrl(data.imageUrl);
      } else {
        const err = await res.json();
        alert(`Erreur de génération : ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur technique lors de la génération.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Confirm using generated image
  const acceptGeneratedImage = () => {
    if (!generatedImageUrl) return;
    if (imageTarget === "hairstyle" && editingHairstyle) {
      setEditingHairstyle((prev) => ({ ...prev, image: generatedImageUrl }));
    } else if (imageTarget === "gallery") {
      addGalleryItem({
        url: generatedImageUrl,
        type: "image",
        category: newGalleryCat,
        description: { fr: imagePrompt, ar: "", en: imagePrompt }
      });
    }
    setShowAiGeneratorModal(false);
    setGeneratedImageUrl("");
    setImagePrompt("");
  };

  // Group bookings by date to build custom SVG chart
  const getWeeklyStatsData = () => {
    if (!stats || !stats.bookingsHistory) return [];
    return stats.bookingsHistory.slice(-7);
  };

  const chartData = getWeeklyStatsData();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col" id="admin-panel-root">
      {/* Admin Navbar */}
      <header className="p-6 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-800">
            <Unlock className="w-4 h-4 text-neutral-300" />
          </div>
          <div>
            <h2 className="text-sm font-serif tracking-widest font-bold">CONCOLE DIRECTEUR</h2>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">HAYTEM BARBER ADMIN</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => (window as any).__setAppView?.("home")}
            className="px-4 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-all duration-300"
            id="admin-back-to-site-btn"
          >
            Voir le site public
          </button>
          <button
            onClick={() => {
              logoutAdmin();
              (window as any).__setAppView?.("home");
            }}
            className="px-4 py-2 rounded-xl bg-red-950/20 hover:bg-red-900 border border-red-900/40 text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-white transition-all duration-300"
            id="admin-logout-btn"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Admin Grid Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-900 bg-neutral-950/20 p-4 shrink-0">
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Statistiques", icon: TrendingUp },
              { id: "bookings", label: "Réservations", icon: CalIcon, count: bookings.filter((b) => b.status === "pending").length },
              { id: "services", label: "Prestations", icon: Settings },
              { id: "hairstyles", label: "Catalogue Coiffures", icon: Sparkles },
              { id: "gallery", label: "Médiathèque Galerie", icon: ImgIcon },
              { id: "schedule", label: "Horaires", icon: Clock },
              { id: "dictionary", label: "Traductions", icon: Globe },
              { id: "settings", label: "Configuration", icon: FileText }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium uppercase tracking-wider transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-neutral-100 text-black font-semibold"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count && item.count > 0 ? (
                    <span className="bg-neutral-800 text-white px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dashboard Content Panel */}
        <main className="flex-1 p-6 md:p-8 bg-neutral-950/10 overflow-y-auto">
          {/* TAB 1: OVERVIEW STATISTICS */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in" id="admin-tab-overview">
              <h3 className="text-xl font-serif text-white tracking-widest uppercase">TABLEAU DE BORD</h3>

              {/* Status metrics grids */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Visiteurs Uniques</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-mono font-bold text-white">{stats?.totalVisits || 0}</h4>
                    <Users className="w-5 h-5 text-neutral-600" />
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Rendez-vous réels</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-mono font-bold text-white">{stats?.totalBookings || 0}</h4>
                    <CalIcon className="w-5 h-5 text-neutral-600" />
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Chiffre d'Affaires</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-mono font-bold text-white">{stats?.totalRevenue || 0} DZD</h4>
                    <DollarSign className="w-5 h-5 text-neutral-600" />
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Demandes En Attente</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-mono font-bold text-white">
                      {bookings.filter((b) => b.status === "pending").length}
                    </h4>
                    <Clock className="w-5 h-5 text-neutral-600" />
                  </div>
                </div>
              </div>

              {/* Graphical Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings Trend Chart */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-400">Courbe de Réservation (7 Jours)</h4>
                  {chartData.length > 0 ? (
                    <div className="h-64 flex flex-col justify-between">
                      {/* Custom clean SVG Line Chart for premium B&W render */}
                      <svg className="w-full h-48 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="100" y2="20" stroke="#1c1c1c" strokeWidth="0.5" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#1c1c1c" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="#1c1c1c" strokeWidth="0.5" />
                        
                        {/* Draw the area and line */}
                        {(() => {
                          const maxCount = Math.max(...chartData.map((d) => d.count), 1);
                          const points = chartData
                            .map((d, i) => {
                              const x = (i / (chartData.length - 1)) * 100;
                              const y = 90 - (d.count / maxCount) * 70; // Map count between y:20 and y:90
                              return `${x},${y}`;
                            })
                            .join(" ");

                          const areaPoints = `${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100},${90 - (d.count / maxCount) * 70}`).join(" ")} 100,90 0,90`;

                          return (
                            <>
                              <polygon points={areaPoints} fill="url(#gradient-chart)" opacity="0.1" />
                              <polyline points={points} fill="none" stroke="#ffffff" strokeWidth="1.5" />
                              {chartData.map((d, i) => {
                                const x = (i / (chartData.length - 1)) * 100;
                                const y = 90 - (d.count / maxCount) * 70;
                                return (
                                  <circle key={i} cx={x} cy={y} r="2.5" fill="#ffffff" stroke="#000000" strokeWidth="1" />
                                );
                              })}
                              <defs>
                                <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ffffff" />
                                  <stop offset="100%" stopColor="#000000" />
                                </linearGradient>
                              </defs>
                            </>
                          );
                        })()}
                      </svg>
                      {/* X Axis labels */}
                      <div className="flex justify-between px-1 text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                        {chartData.map((d, i) => (
                          <span key={i}>{d.date.split("-").slice(1).join("/")}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-900 rounded-2xl">
                      <TrendingUp className="w-8 h-8 text-neutral-800 mb-2" />
                      <p className="text-xs text-neutral-500">Aucun historique de réservation disponible pour l'instant.</p>
                      <p className="text-[10px] text-neutral-600 mt-1 uppercase tracking-wider font-mono">Tout commence à zéro !</p>
                    </div>
                  )}
                </div>

                {/* Popular Services Chart */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-400">Services les plus sollicités</h4>
                  {stats && stats.popularServices && stats.popularServices.length > 0 ? (
                    <div className="space-y-4">
                      {stats.popularServices.map((pop, idx) => {
                        const maxCount = Math.max(...stats.popularServices.map((p) => p.count), 1);
                        const percent = (pop.count / maxCount) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs text-neutral-400">
                              <span>{pop.title}</span>
                              <span className="font-mono text-white font-semibold">{pop.count} fois</span>
                            </div>
                            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-900 rounded-2xl">
                      <Sparkles className="w-8 h-8 text-neutral-800 mb-2" />
                      <p className="text-xs text-neutral-500">En attente de réservations réelles pour calculer la popularité.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS TABLE */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-bookings">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-serif text-white tracking-widest uppercase">LISTE DES RÉSERVATIONS</h3>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">Gérez le planning, validez, reportez ou créez des rendez-vous en direct.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddBookingModal(true)}
                    className="inline-flex items-center space-x-1.5 bg-white text-black hover:bg-neutral-200 px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Saisir Manuellement</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    title="Télécharger un tableau CSV Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter CSV</span>
                  </button>
                  <button
                    onClick={handlePrintBookings}
                    className="inline-flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white px-3 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    title="Imprimer la page"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer</span>
                  </button>
                </div>
              </div>

              {/* Filtering bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-950 p-4 border border-neutral-900">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer par nom ou téléphone..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-850 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-700 transition"
                  />
                </div>

                <div>
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-850 px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-neutral-700 transition"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente (Pending)</option>
                    <option value="confirmed">Confirmés (Confirmed)</option>
                    <option value="completed">Terminés (Completed)</option>
                    <option value="cancelled">Annulés (Cancelled)</option>
                  </select>
                </div>

                <div className="text-[10px] text-neutral-500 font-mono flex items-center justify-end">
                  Total affiché : {bookings.filter(
                    (b) =>
                      (b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                        b.customerPhone.includes(bookingSearch)) &&
                      (bookingStatusFilter === "all" || b.status === bookingStatusFilter)
                  ).length} réservations
                </div>
              </div>

              {/* Bookings list */}
              <div className="bg-neutral-950 border border-neutral-900 overflow-hidden shadow-2xl">
                {bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-900 bg-black/40 text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                          <th className="p-4 pl-6">Client</th>
                          <th className="p-4">WhatsApp / Tél</th>
                          <th className="p-4">Prestation</th>
                          <th className="p-4">Date & Heure</th>
                          <th className="p-4">Statut</th>
                          <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900 text-xs">
                        {bookings
                          .filter(
                            (b) =>
                              (b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                                b.customerPhone.includes(bookingSearch)) &&
                              (bookingStatusFilter === "all" || b.status === bookingStatusFilter)
                          )
                          .reverse()
                          .map((b) => {
                            const srv = db?.services.find((s) => s.id === b.serviceId);
                            const title = srv ? tText(srv.title) : "Service inconnu";
                            const formattedDate = b.date.split("-").reverse().join("/");

                            // Color states
                            let statusColor = "";
                            let statusLabel = "";
                            if (b.status === "pending") {
                              statusColor = "text-yellow-400 bg-yellow-500/5 border-yellow-500/20";
                              statusLabel = "En attente";
                            } else if (b.status === "confirmed") {
                              statusColor = "text-blue-400 bg-blue-500/5 border-blue-500/20";
                              statusLabel = "Confirmé";
                            } else if (b.status === "completed") {
                              statusColor = "text-green-400 bg-green-500/5 border-green-500/20";
                              statusLabel = "Terminé";
                            } else {
                              statusColor = "text-neutral-500 bg-neutral-900 border-neutral-800";
                              statusLabel = "Annulé";
                            }

                            return (
                              <tr key={b.id} className="hover:bg-neutral-900/10 transition-colors duration-200">
                                <td className="p-4 pl-6 font-semibold text-white">
                                  <div>{b.customerName}</div>
                                  {b.userId && (
                                    <span className="text-[8px] uppercase tracking-widest bg-accent/10 text-accent px-1 py-0.5 rounded-none font-mono">
                                      Inscrit
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 font-mono">
                                  <a
                                    href={`https://wa.me/${b.customerPhone.replace(/[\s+]/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-300 hover:text-white underline inline-flex items-center space-x-1"
                                  >
                                    <span>{b.customerPhone}</span>
                                  </a>
                                </td>
                                <td className="p-4 text-neutral-300">{title}</td>
                                <td className="p-4 font-mono text-neutral-300">
                                  {reschedulingId === b.id ? (
                                    <div className="flex items-center space-x-1.5 bg-neutral-900 p-1.5 border border-neutral-800">
                                      <input
                                        type="date"
                                        value={rescheduleDate}
                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                        className="bg-neutral-950 border border-neutral-850 text-white text-[10px] px-1.5 py-1 focus:outline-none focus:border-neutral-700 rounded-none w-28 font-mono"
                                      />
                                      <input
                                        type="time"
                                        value={rescheduleTime}
                                        onChange={(e) => setRescheduleTime(e.target.value)}
                                        className="bg-neutral-950 border border-neutral-850 text-white text-[10px] px-1.5 py-1 focus:outline-none focus:border-neutral-700 rounded-none w-16 font-mono"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAdminReschedule(b.id)}
                                        className="bg-white text-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-200 transition"
                                        title="Valider le report"
                                      >
                                        Confirmer
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReschedulingId(null)}
                                        className="text-neutral-500 hover:text-white text-xs px-1"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <span>{formattedDate} &bull; {b.time}</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                                  {b.status === "pending" && (
                                    <button
                                      onClick={() => updateBookingStatus(b.id, "confirmed")}
                                      className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all duration-300 cursor-pointer inline-flex"
                                      title="Confirmer"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    </button>
                                  )}
                                  {b.status !== "completed" && b.status !== "cancelled" && (
                                    <>
                                      <button
                                        onClick={() => updateBookingStatus(b.id, "completed")}
                                        className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all duration-300 cursor-pointer inline-flex"
                                        title="Marquer comme complété"
                                      >
                                        <Check className="w-4 h-4 text-white" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReschedulingId(reschedulingId === b.id ? null : b.id);
                                          setRescheduleDate(b.date);
                                          setRescheduleTime(b.time);
                                        }}
                                        className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all duration-300 cursor-pointer inline-flex"
                                        title="Reporter le RDV"
                                      >
                                        <Clock className="w-4 h-4 text-amber-500" />
                                      </button>
                                      <button
                                        onClick={() => updateBookingStatus(b.id, "cancelled")}
                                        className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all duration-300 cursor-pointer inline-flex"
                                        title="Annuler"
                                      >
                                        <XCircle className="w-4 h-4 text-red-500" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (confirm("Supprimer définitivement cette réservation de la base de données ? Cette action mettra à jour les historiques et statistiques en direct.")) {
                                        await deleteBooking(b.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border border-neutral-800 hover:border-red-900 bg-neutral-950 text-neutral-500 hover:text-red-500 hover:bg-red-950/20 transition-all duration-300 cursor-pointer inline-flex"
                                    title="Supprimer définitivement"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center p-6 space-y-3">
                    <CalIcon className="w-8 h-8 text-neutral-800 mx-auto" />
                    <p className="text-sm text-neutral-500">Aucune réservation trouvée.</p>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-mono">
                      Partagez le lien du salon pour recevoir des demandes réelles !
                    </p>
                  </div>
                )}
              </div>

              {/* MANUAL ADD BOOKING MODAL */}
              {showAddBookingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                  <div className="bg-neutral-950 border border-neutral-900 w-full max-w-md p-6 relative">
                    <button
                      onClick={() => setShowAddBookingModal(false)}
                      className="absolute top-4 right-4 text-neutral-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <h4 className="text-base font-serif text-white uppercase tracking-wider mb-4 border-b border-neutral-900 pb-2">
                      Saisir un Rendez-vous en Direct
                    </h4>

                    <form onSubmit={handleAddManualBooking} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Nom du Client *</label>
                        <input
                          type="text"
                          required
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="Ex: Sofiane Batna"
                          className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Téléphone / WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          placeholder="Ex: 0550123456"
                          className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2.5 text-white focus:outline-none focus:border-neutral-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Prestation *</label>
                        <select
                          required
                          value={manualServiceId}
                          onChange={(e) => setManualServiceId(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2.5 text-neutral-300 focus:outline-none focus:border-neutral-700"
                        >
                          <option value="">-- Sélectionner --</option>
                          {db?.services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {tText(s.title)} - {s.price} DZD ({s.duration} min)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Date *</label>
                          <input
                            type="date"
                            required
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2.5 text-white font-mono focus:outline-none focus:border-neutral-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Heure *</label>
                          <input
                            type="time"
                            required
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2.5 text-white font-mono focus:outline-none focus:border-neutral-700"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest py-3 transition mt-2 cursor-pointer"
                      >
                        Enregistrer dans le planning
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICES CRUD */}
          {activeTab === "services" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-services">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <h3 className="text-xl font-serif text-white tracking-widest uppercase">PRESTATIONS</h3>
                <button
                  onClick={() =>
                    setEditingService({
                      title: { fr: "", ar: "", en: "" },
                      description: { fr: "", ar: "", en: "" },
                      price: null,
                      duration: 30,
                      category: "Haircut",
                      availability: true
                    })
                  }
                  className="flex items-center space-x-1.5 bg-neutral-100 text-black hover:bg-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  id="add-service-btn"
                >
                  <Plus className="w-4 h-4 mr-1 shrink-0" />
                  <span>Ajouter</span>
                </button>
              </div>

              {/* Service list editor forms */}
              {editingService ? (
                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm uppercase font-bold tracking-widest text-neutral-400">
                    {editingService.id ? "Modifier la prestation" : "Créer une prestation"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Title Translations */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Titre (Français)</label>
                      <input
                        type="text"
                        value={editingService.title?.fr || ""}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            title: { ...prev!.title, fr: e.target.value } as any
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Titre (Arabe)</label>
                      <input
                        type="text"
                        value={editingService.title?.ar || ""}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            title: { ...prev!.title, ar: e.target.value } as any
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Titre (Anglais)</label>
                      <input
                        type="text"
                        value={editingService.title?.en || ""}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            title: { ...prev!.title, en: e.target.value } as any
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Description Translations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description (Français)</label>
                      <textarea
                        value={editingService.description?.fr || ""}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            description: { ...prev!.description, fr: e.target.value } as any
                          }))
                        }
                        rows={3}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description (Arabe)</label>
                      <textarea
                        value={editingService.description?.ar || ""}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            description: { ...prev!.description, ar: e.target.value } as any
                          }))
                        }
                        rows={3}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description (Anglais)</label>
                      <textarea
                        value={editingService.description?.en || ""}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            description: { ...prev!.description, en: e.target.value } as any
                          }))
                        }
                        rows={3}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Duration, Price & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Durée (minutes)</label>
                      <input
                        type="number"
                        value={editingService.duration || 30}
                        onChange={(e) =>
                          setEditingService((prev) => ({ ...prev, duration: Number(e.target.value) }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Prix (DZD) - Laisser vide pour "Tarif sur demande"</label>
                      <input
                        type="number"
                        value={editingService.price === null ? "" : editingService.price}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            price: e.target.value ? Number(e.target.value) : null
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Catégorie</label>
                      <select
                        value={editingService.category || "Haircut"}
                        onChange={(e) => setEditingService((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none uppercase font-mono tracking-widest"
                      >
                        <option value="Haircut">Coupe (Haircut)</option>
                        <option value="Beard">Barbe (Beard)</option>
                        <option value="Styling">Coiffage (Styling)</option>
                        <option value="Coloring">Coloration (Coloring)</option>
                        <option value="Special">Formule Spéciale</option>
                        <option value="Other">Autre</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Disponibilité</label>
                      <div className="flex items-center space-x-2 pt-3">
                        <input
                          type="checkbox"
                          checked={editingService.availability ?? true}
                          onChange={(e) =>
                            setEditingService((prev) => ({ ...prev, availability: e.target.checked }))
                          }
                          className="w-4 h-4 accent-neutral-100"
                        />
                        <span className="text-xs text-neutral-300">Activer ce service</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-900">
                    <button
                      onClick={() => setEditingService(null)}
                      className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 text-xs font-semibold uppercase tracking-wider"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        await saveService(editingService);
                        setEditingService(null);
                      }}
                      className="px-5 py-2.5 bg-neutral-100 text-black hover:bg-white rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Service cards list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {db.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full">
                          {srv.category}
                        </span>
                        {!srv.availability && (
                          <span className="text-[9px] uppercase tracking-widest font-mono text-red-500 bg-red-950/20 px-2 py-0.5 rounded-full border border-red-900/30">
                            Masqué (Indisponible)
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-sm tracking-wide pt-1">{tText(srv.title)}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{tText(srv.description)}</p>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        Durée : {srv.duration} min
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-900/60">
                      <span className="font-mono text-xs font-bold text-neutral-200">
                        {srv.price ? `${srv.price} DZD` : "Tarif sur demande"}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setEditingService(srv)}
                          className="p-1.5 rounded-lg border border-neutral-900 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all duration-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteService(srv.id)}
                          className="p-1.5 rounded-lg border border-neutral-900 bg-neutral-950 text-red-500 hover:text-red-400 hover:bg-neutral-900 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HAIRSTYLES CRUD */}
          {activeTab === "hairstyles" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-hairstyles">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <h3 className="text-xl font-serif text-white tracking-widest uppercase">CATALOGUE COIFFURES</h3>
                <button
                  onClick={() =>
                    setEditingHairstyle({
                      name: { fr: "", ar: "", en: "" },
                      description: { fr: "", ar: "", en: "" },
                      image: "",
                      video: "",
                      price: null,
                      duration: 30,
                      difficulty: 3,
                      category: "Buzz Cut"
                    })
                  }
                  className="flex items-center space-x-1.5 bg-neutral-100 text-black hover:bg-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  id="add-hairstyle-btn"
                >
                  <Plus className="w-4 h-4 mr-1 shrink-0" />
                  <span>Ajouter</span>
                </button>
              </div>

              {/* Hairstyle edit forms */}
              {editingHairstyle ? (
                <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm uppercase font-bold tracking-widest text-neutral-400">
                    {editingHairstyle.id ? "Modifier la coupe" : "Créer une coupe"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Name Translations */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Nom (Français)</label>
                      <input
                        type="text"
                        value={editingHairstyle.name?.fr || ""}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            name: { ...prev!.name, fr: e.target.value } as any
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Nom (Arabe)</label>
                      <input
                        type="text"
                        value={editingHairstyle.name?.ar || ""}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            name: { ...prev!.name, ar: e.target.value } as any
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Nom (Anglais)</label>
                      <input
                        type="text"
                        value={editingHairstyle.name?.en || ""}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            name: { ...prev!.name, en: e.target.value } as any
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Description Translations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description (Français)</label>
                      <textarea
                        value={editingHairstyle.description?.fr || ""}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            description: { ...prev!.description, fr: e.target.value } as any
                          }))
                        }
                        rows={3}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description (Arabe)</label>
                      <textarea
                        value={editingHairstyle.description?.ar || ""}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            description: { ...prev!.description, ar: e.target.value } as any
                          }))
                        }
                        rows={3}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description (Anglais)</label>
                      <textarea
                        value={editingHairstyle.description?.en || ""}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            description: { ...prev!.description, en: e.target.value } as any
                          }))
                        }
                        rows={3}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Image and Video Media URL config */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold flex justify-between items-center w-full">
                        <span>Image (URL de référence ou base64)</span>
                        <button
                          onClick={() => {
                            setImageTarget("hairstyle");
                            setShowAiGeneratorModal(true);
                          }}
                          className="text-[10px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 uppercase tracking-wider"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Générer par IA
                        </button>
                      </label>
                      <input
                        type="text"
                        value={editingHairstyle.image || ""}
                        onChange={(e) => setEditingHairstyle((prev) => ({ ...prev, image: e.target.value }))}
                        placeholder="http://..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">URL de Vidéo (Optionnel)</label>
                      <input
                        type="text"
                        value={editingHairstyle.video || ""}
                        onChange={(e) => setEditingHairstyle((prev) => ({ ...prev, video: e.target.value }))}
                        placeholder="http://..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Difficulté technique (1 à 5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={editingHairstyle.difficulty || 3}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({ ...prev, difficulty: Number(e.target.value) }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Catégorie de coupe</label>
                      <select
                        value={editingHairstyle.category || "Low Fade"}
                        onChange={(e) => setEditingHairstyle((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none uppercase font-mono tracking-widest"
                      >
                        <option value="Buzz Cut">Buzz Cut</option>
                        <option value="French Crop">French Crop</option>
                        <option value="Pompadour">Pompadour</option>
                        <option value="Low Fade">Low Fade</option>
                        <option value="Mid Fade">Mid Fade</option>
                        <option value="High Fade">High Fade</option>
                        <option value="Skin Fade">Skin Fade</option>
                        <option value="Taper Fade">Taper Fade</option>
                        <option value="Afro">Afro</option>
                        <option value="Curly Hair">Curly Hair</option>
                        <option value="Classic Haircuts">Coupe Classique</option>
                        <option value="Modern Haircuts">Coupe Moderne</option>
                        <option value="Beard Trim">Barbe (Trim)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Durée indicative (min)</label>
                      <input
                        type="number"
                        value={editingHairstyle.duration || 30}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({ ...prev, duration: Number(e.target.value) }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Prix estimé (Optionnel)</label>
                      <input
                        type="number"
                        value={editingHairstyle.price === null ? "" : editingHairstyle.price}
                        onChange={(e) =>
                          setEditingHairstyle((prev) => ({
                            ...prev,
                            price: e.target.value ? Number(e.target.value) : null
                          }))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-900">
                    <button
                      onClick={() => setEditingHairstyle(null)}
                      className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 text-xs font-semibold uppercase tracking-wider"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        await saveHairstyle(editingHairstyle);
                        setEditingHairstyle(null);
                      }}
                      className="px-5 py-2.5 bg-neutral-100 text-black hover:bg-white rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Hairstyle grid display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {db.hairstyles.map((hair) => (
                  <div
                    key={hair.id}
                    className="bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
                  >
                    <div className="h-44 bg-neutral-900 flex items-center justify-center overflow-hidden relative">
                      {hair.image ? (
                        <img src={hair.image} alt={tText(hair.name)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <ImgIcon className="w-8 h-8 text-neutral-700 mx-auto mb-1.5" />
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Image vide</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 text-[8px] uppercase tracking-widest bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full font-bold">
                        {hair.category}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-xs uppercase tracking-wider text-white">{tText(hair.name)}</h4>
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{tText(hair.description)}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span>Durée: {hair.duration} min</span>
                        <span>Difficulté: {hair.difficulty}/5 ★</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-900">
                        <span className="text-xs font-mono font-bold">
                          {hair.price ? `${hair.price} DZD` : "Non défini"}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingHairstyle(hair)}
                            className="p-1.5 rounded-lg border border-neutral-900 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all duration-300"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => deleteHairstyle(hair.id)}
                            className="p-1.5 rounded-lg border border-neutral-900 bg-neutral-950 text-red-500 hover:text-red-400 hover:bg-neutral-900 transition-all duration-300"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: GALLERY MANAGER */}
          {activeTab === "gallery" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-gallery">
              <h3 className="text-xl font-serif text-white tracking-widest uppercase border-b border-neutral-900 pb-4">
                MÉDIATHÈQUE GALERIE
              </h3>

              {/* Add item to gallery card */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-400 flex justify-between items-center">
                  <span>Enregistrer un nouveau média</span>
                  <button
                    onClick={() => {
                      setImageTarget("gallery");
                      setShowAiGeneratorModal(true);
                    }}
                    className="text-[10px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Générer une photo par IA
                  </button>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold">URL de l'image / Vidéo</label>
                    <input
                      type="text"
                      placeholder="http://..."
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold">Type de média</label>
                    <select
                      value={newGalleryType}
                      onChange={(e) => setNewGalleryType(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    >
                      <option value="image">Image (Photo)</option>
                      <option value="video">Vidéo (URL)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold">Catégorie</label>
                    <select
                      value={newGalleryCat}
                      onChange={(e) => setNewGalleryCat(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none uppercase font-mono tracking-wider"
                    >
                      <option value="Coupe">Coupe (Haircut)</option>
                      <option value="Barbe">Barbe (Beard)</option>
                      <option value="Soin">Soin (Care)</option>
                      <option value="Salon">Salon (Interior)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={async () => {
                      if (!newGalleryUrl.trim()) return;
                      await addGalleryItem({
                        url: newGalleryUrl,
                        type: newGalleryType,
                        category: newGalleryCat,
                        description: { fr: "Nouvelle photo galerie", ar: "", en: "New gallery item" }
                      });
                      setNewGalleryUrl("");
                    }}
                    className="px-5 py-2.5 bg-neutral-100 text-black hover:bg-white rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Ajouter à la galerie
                  </button>
                </div>
              </div>

              {/* Gallery elements display */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {db.gallery.map((g) => (
                  <div
                    key={g.id}
                    className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-xl relative group"
                  >
                    <div className="h-36 bg-neutral-900 relative">
                      {g.type === "image" ? (
                        <img src={g.url} alt="Gallery" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <Bot className="w-6 h-6 text-neutral-700" />
                          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono mt-1">Lien Vidéo</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 text-[8px] uppercase tracking-widest bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                        {g.category}
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">{g.type}</span>
                      <button
                        onClick={() => deleteGalleryItem(g.id)}
                        className="p-1 bg-red-950/20 text-red-500 hover:bg-red-900 hover:text-white rounded-lg transition-all duration-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: HOURS CONFIG */}
          {activeTab === "schedule" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-schedule">
              <h3 className="text-xl font-serif text-white tracking-widest uppercase border-b border-neutral-900 pb-4">
                HORAIRES DE TRAVAIL
              </h3>
              <p className="text-xs text-neutral-400">
                Configurez les heures d'ouverture quotidiennes du salon de coiffure. Cochez "Fermé" pour masquer les créneaux d'un jour donné.
              </p>

              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                <div className="space-y-3.5">
                  {db.workingHours.map((day, idx) => (
                    <div
                      key={day.dayKey}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-neutral-900/60 last:border-b-0"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-semibold w-24 text-white uppercase tracking-wider">{day.day}</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={day.isClosed}
                            onChange={(e) => {
                              const updated = [...db.workingHours];
                              updated[idx].isClosed = e.target.checked;
                              // Clear hours if closed
                              if (e.target.checked) {
                                updated[idx].open = "";
                                updated[idx].close = "";
                              } else {
                                updated[idx].open = "09:00";
                                updated[idx].close = "19:00";
                              }
                              updateWorkingHours(updated);
                            }}
                            className="w-4 h-4 accent-neutral-100"
                          />
                          <span className="text-xs text-neutral-400">Fermé (Closed)</span>
                        </div>
                      </div>

                      {!day.isClosed && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="09:00"
                            value={day.open}
                            onChange={(e) => {
                              const updated = [...db.workingHours];
                              updated[idx].open = e.target.value;
                              updateWorkingHours(updated);
                            }}
                            className="bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2 text-xs font-mono text-center w-24"
                          />
                          <span className="text-neutral-500 font-bold">&bull;</span>
                          <input
                            type="text"
                            placeholder="19:00"
                            value={day.close}
                            onChange={(e) => {
                              const updated = [...db.workingHours];
                              updated[idx].close = e.target.value;
                              updateWorkingHours(updated);
                            }}
                            className="bg-neutral-900 border border-neutral-850 rounded-xl px-3 py-2 text-xs font-mono text-center w-24"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DICTIONARY EDITOR */}
          {activeTab === "dictionary" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-dictionary">
              <h3 className="text-xl font-serif text-white tracking-widest uppercase border-b border-neutral-900 pb-4">
                TRADUCTION DES TEXTES LIVE
              </h3>
              <p className="text-xs text-neutral-400">
                Ajustez le dictionnaire de traduction pour chaque libellé de l'application (Français, Arabe, Anglais).
              </p>

              <div className="space-y-4">
                {Object.entries(db.dictionary).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-4">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">
                      Clé d'interface : {key}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400">Français (FR)</label>
                        <input
                          type="text"
                          value={value.fr}
                          onChange={(e) => {
                            const updatedDict = {
                              [key]: { ...value, fr: e.target.value }
                            };
                            saveDictionary(updatedDict);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400">Arabe (AR)</label>
                        <input
                          type="text"
                          value={value.ar}
                          onChange={(e) => {
                            const updatedDict = {
                              [key]: { ...value, ar: e.target.value }
                            };
                            saveDictionary(updatedDict);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-neutral-400">Anglais (EN)</label>
                        <input
                          type="text"
                          value={value.en}
                          onChange={(e) => {
                            const updatedDict = {
                              [key]: { ...value, en: e.target.value }
                            };
                            saveDictionary(updatedDict);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS & GENERAL INFO */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in" id="admin-tab-settings">
              <h3 className="text-xl font-serif text-white tracking-widest uppercase border-b border-neutral-900 pb-4">
                CONFIGURATION DU SALON & TEXTES DE MARQUE
              </h3>

              <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 space-y-6">
                {/* Contact information edit */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-400">Coordonnées de Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Téléphone direct</label>
                      <input
                        type="text"
                        value={db.businessInfo.phone}
                        onChange={(e) => updateBusinessInfo({ phone: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">WhatsApp</label>
                      <input
                        type="text"
                        value={db.businessInfo.whatsapp}
                        onChange={(e) => updateBusinessInfo({ whatsapp: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Lien Instagram</label>
                      <input
                        type="text"
                        value={db.businessInfo.instagram}
                        onChange={(e) => updateBusinessInfo({ instagram: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Lien TikTok</label>
                      <input
                        type="text"
                        value={db.businessInfo.tiktok}
                        onChange={(e) => updateBusinessInfo({ tiktok: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Lien Facebook</label>
                      <input
                        type="text"
                        value={db.businessInfo.facebook}
                        onChange={(e) => updateBusinessInfo({ facebook: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold">Lien de Localisation Google Maps</label>
                    <input
                      type="text"
                      value={db.businessInfo.googleMaps}
                      onChange={(e) => updateBusinessInfo({ googleMaps: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Biography & Brand Mission */}
                <div className="space-y-4 pt-6 border-t border-neutral-900">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-400">Histoire & Philosophie de Luxe</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Biographie de Haytem Mehazzem (Français)</label>
                      <textarea
                        value={db.businessInfo.biography?.fr || ""}
                        onChange={(e) =>
                          updateBusinessInfo({
                            biography: { ...db.businessInfo.biography, fr: e.target.value }
                          })
                        }
                        rows={4}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 uppercase font-semibold">Biographie (Arabe)</label>
                      <textarea
                        value={db.businessInfo.biography?.ar || ""}
                        onChange={(e) =>
                          updateBusinessInfo({
                            biography: { ...db.businessInfo.biography, ar: e.target.value }
                          })
                        }
                        rows={4}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin passcode override */}
                <div className="space-y-4 pt-6 border-t border-neutral-900">
                  <h4 className="text-xs uppercase font-bold tracking-widest text-neutral-400">Sécurité du Portail Admin</h4>
                  <div className="max-w-xs space-y-1.5">
                    <label className="text-[10px] text-neutral-400 uppercase font-semibold">Modifier le code d'accès à 4 chiffres</label>
                    <input
                      type="text"
                      maxLength={10}
                      defaultValue={localStorage.getItem("haytem_barber_admin_passcode") || "1234"}
                      onChange={(e) => {
                        if (e.target.value.trim().length >= 4) {
                          updateBusinessInfo({
                            policies: { ...db.businessInfo.policies, adminPasscode: e.target.value.trim() }
                          });
                        }
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white font-mono tracking-widest"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: AI IMAGE GENERATOR CONTROLS */}
      {showAiGeneratorModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-850 rounded-3xl w-full max-w-lg p-6 space-y-6 relative shadow-2xl">
            <button
              onClick={() => {
                setShowAiGeneratorModal(false);
                setGeneratedImageUrl("");
                setImagePrompt("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-neutral-300" />
              <h3 className="text-sm font-serif tracking-widest uppercase font-bold text-white">Générateur d'Images IA</h3>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Propulsé par le modèle <strong>gemini-3-pro-image</strong>. Entrez une description et sélectionnez la résolution de génération (1K, 2K ou 4K).
            </p>

            {/* Size choice */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-semibold">Résolution de l'image (Taille)</label>
              <div className="grid grid-cols-3 gap-2">
                {(["1K", "2K", "4K"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-2 rounded-xl text-center text-xs border font-mono transition-all ${
                      imageSize === sz ? "bg-white text-black border-white font-bold" : "bg-neutral-900 border-neutral-800 text-neutral-300"
                    }`}
                  >
                    {sz} {sz === "1K" ? "(Standard)" : sz === "2K" ? "(HD)" : "(UHD)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 uppercase font-semibold">Description de la coupe de cheveux (En Anglais pour de meilleurs résultats)</label>
              <textarea
                rows={3}
                placeholder="Ex: Elegant low taper fade with modern textured fringe, side view, dramatic high contrast studio lighting..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Render generated media */}
            {generatedImageUrl && (
              <div className="space-y-2 border-t border-neutral-900 pt-4 text-center">
                <span className="text-[10px] text-neutral-500 uppercase font-mono block">Image générée avec succès :</span>
                <div className="h-48 w-48 bg-neutral-900 rounded-2xl overflow-hidden mx-auto border border-neutral-800">
                  <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Footer triggers */}
            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => {
                  setShowAiGeneratorModal(false);
                  setGeneratedImageUrl("");
                  setImagePrompt("");
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 text-xs font-semibold uppercase tracking-wider"
              >
                Fermer
              </button>
              {generatedImageUrl ? (
                <button
                  type="button"
                  onClick={acceptGeneratedImage}
                  className="px-5 py-2.5 bg-green-600 text-white hover:bg-green-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                >
                  Appliquer l'Image
                </button>
              ) : (
                <button
                  type="button"
                  onClick={generateAiImage}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="flex items-center space-x-1.5 bg-neutral-100 text-black hover:bg-white disabled:bg-neutral-900 disabled:text-neutral-500 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4 mr-1 shrink-0" />
                  <span>{isGeneratingImage ? "Génération..." : "Générer la photo"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
