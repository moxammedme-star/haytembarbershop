import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { X, Calendar as CalIcon, Clock, User, Phone, CheckCircle2, ChevronRight, AlertCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Service } from "../types";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, preselectedServiceId }) => {
  const { db, createBooking, currentLanguage, t, tText, bookings, user } = useApp();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Autofill name and phone if user is logged in
  useEffect(() => {
    if (user && isOpen) {
      setClientName(user.name);
      setClientPhone(user.phone);
    }
  }, [user, isOpen]);

  // Helper to convert "HH:MM" to minutes from midnight
  const timeToMinutes = (tStr: string) => {
    const [h, m] = tStr.split(":").map(Number);
    return h * 60 + m;
  };

  // Overlapping slot detector
  const isSlotBlocked = (timeSlot: string) => {
    if (!selectedDate || !selectedService) return false;
    const duration = selectedService.duration;
    const slotStart = timeToMinutes(timeSlot);
    const slotEnd = slotStart + duration;

    // Check overlap against active, non-cancelled bookings
    return bookings.some((b) => {
      if (b.date !== selectedDate || b.status === "cancelled") return false;
      const bSrv = db.services.find((s) => s.id === b.serviceId);
      const bDuration = bSrv ? bSrv.duration : 30;
      const bStart = timeToMinutes(b.time);
      const bEnd = bStart + bDuration;

      return slotStart < bEnd && bStart < slotEnd;
    });
  };

  // Set preselected service if provided
  useEffect(() => {
    if (db && preselectedServiceId) {
      const srv = db.services.find((s) => s.id === preselectedServiceId);
      if (srv) setSelectedService(srv);
    }
  }, [preselectedServiceId, db, isOpen]);

  if (!isOpen || !db) return null;

  // Generate next 7 days for the date picker
  const getNext7Days = () => {
    const days = [];
    const weekdaysFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const weekdaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdaysAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const fullDate = `${year}-${month}-${day}`;
      const dayIndex = date.getDay();

      // Check if this day is closed in our database config
      const dayKeys: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thuesday' | 'friday' | 'saturday')[] = [
        "sunday", "monday", "tuesday", "wednesday", "thuesday", "friday", "saturday"
      ];
      const dayKey = dayKeys[dayIndex];
      const configDay = db.workingHours.find((h) => h.dayKey === dayKey);
      const isClosed = configDay ? configDay.isClosed : true;

      // Label based on current language
      let label = "";
      if (currentLanguage === "fr") {
        label = i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : `${weekdaysFr[dayIndex]} ${day}`;
      } else if (currentLanguage === "ar") {
        label = i === 0 ? "اليوم" : i === 1 ? "غداً" : `${weekdaysAr[dayIndex]} ${day}`;
      } else {
        label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${weekdaysEn[dayIndex]} ${day}`;
      }

      days.push({
        value: fullDate,
        label,
        isClosed,
        dayIndex
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  // Generate timeslots for the selected date
  const getTimeSlots = () => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    const dayIndex = dateObj.getDay();
    const dayKeys: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thuesday' | 'friday' | 'saturday')[] = [
      "sunday", "monday", "tuesday", "wednesday", "thuesday", "friday", "saturday"
    ];
    const dayKey = dayKeys[dayIndex];
    const configDay = db.workingHours.find((h) => h.dayKey === dayKey);

    let startHour = 9;
    let endHour = 19;

    if (configDay && !configDay.isClosed && configDay.open && configDay.close) {
      const [oH, oM] = configDay.open.split(":").map(Number);
      const [cH, cM] = configDay.close.split(":").map(Number);
      startHour = oH;
      endHour = cH;
    } else {
      // Fallback standard slots if workingHours are fully empty/unconfigured
      startHour = 9;
      endHour = 19;
    }

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const hStr = String(hour).padStart(2, "0");
      slots.push(`${hStr}:00`);
      slots.push(`${hStr}:30`);
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  const handleNextStep = () => {
    setError("");
    if (step === 1 && !selectedService) {
      setError(currentLanguage === "fr" ? "Veuillez sélectionner une prestation." : currentLanguage === "ar" ? "يرجى اختيار الخدمة أولاً." : "Please select a service.");
      return;
    }
    if (step === 2 && (!selectedDate || !selectedTime)) {
      setError(currentLanguage === "fr" ? "Veuillez choisir une date et un créneau horaire." : currentLanguage === "ar" ? "يرجى اختيار التاريخ والوقت." : "Please choose a date and time slot.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clientName.trim()) {
      setError(currentLanguage === "fr" ? "Veuillez saisir votre nom." : currentLanguage === "ar" ? "يرجى إدخال اسمك." : "Please enter your name.");
      return;
    }
    if (!clientPhone.trim()) {
      setError(currentLanguage === "fr" ? "Veuillez saisir votre numéro de téléphone." : currentLanguage === "ar" ? "يرجى إدخال رقم هاتفك." : "Please enter your phone number.");
      return;
    }

    setIsSubmitting(true);
    const successResult = await createBooking({
      customerName: clientName,
      customerPhone: clientPhone,
      serviceId: selectedService!.id,
      date: selectedDate,
      time: selectedTime
    });

    setIsSubmitting(false);
    if (successResult) {
      setBookingDetails({
        serviceName: tText(selectedService!.title),
        price: selectedService!.price,
        date: selectedDate,
        time: selectedTime
      });
      setSuccess(true);
    } else {
      setError(currentLanguage === "fr" ? "Erreur lors de la réservation. Veuillez réessayer." : currentLanguage === "ar" ? "حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى." : "Error creating booking. Please try again.");
    }
  };

  // WhatsApp auto-confirmation direct to the barber
  const handleWhatsAppRedirect = () => {
    if (!bookingDetails) return;
    const formattedDate = bookingDetails.date.split("-").reverse().join("/");
    const priceText = bookingDetails.price ? `${bookingDetails.price} DZD` : "Tarif sur demande";
    const text = `Bonjour Haytem Barber, je souhaite confirmer ma réservation en ligne :
    
👤 Client : ${clientName}
📞 Tél : ${clientPhone}
💇‍♂️ Prestation : ${bookingDetails.serviceName}
📅 Date : ${formattedDate}
⏰ Heure : ${bookingDetails.time}
💰 Tarif : ${priceText}

Merci !`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/213675161187?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  const isRtl = currentLanguage === "ar";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-none w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl shadow-black/50"
        id="booking-modal-card"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div>
            <h3 className="text-lg font-serif tracking-[0.15em] text-white uppercase font-normal">
              {success ? t("booking_confirmed") || "RÉSERVATION EFFECTUÉE" : t("book_appointment") || "PRENDRE RENDEZ-VOUS"}
            </h3>
            {!success && (
              <p className="text-xs text-accent mt-1 uppercase font-mono tracking-widest text-[9px]">
                {isRtl ? `خطوة ${step} من 3` : `Étape ${step} sur 3`} &bull; {selectedService ? tText(selectedService.title) : (isRtl ? "اختيار الخدمة" : "Sélection de la prestation")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-none border border-white/10 text-neutral-400 hover:text-accent hover:border-accent/40 hover:bg-white/5 transition-all duration-300"
            id="close-booking-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-4 p-3.5 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-start space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!success ? (
              <div>
                {/* STEP 1: SERVICE SELECTION */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-neutral-400 mb-4">
                      {isRtl ? "اختر الخدمة الفاخرة التي ترغب بها اليوم:" : "Sélectionnez le soin de luxe de votre choix :"}
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {db.services.filter(s => s.availability).map((srv) => (
                        <button
                          key={srv.id}
                          onClick={() => setSelectedService(srv)}
                          className={`flex items-center justify-between p-4 rounded-none border transition-all duration-300 text-left ${
                            selectedService?.id === srv.id
                              ? "bg-white text-black border-white"
                              : "bg-[#0a0a0a] border-white/10 text-white hover:border-accent/40"
                          }`}
                          style={{ direction: isRtl ? "rtl" : "ltr" }}
                        >
                          <div className="space-y-1">
                            <h4 className="font-serif text-base tracking-wide">{tText(srv.title)}</h4>
                            <p className={`text-xs ${selectedService?.id === srv.id ? "text-neutral-700" : "text-neutral-400"}`}>
                              {tText(srv.description)}
                            </p>
                            <span className={`text-[9px] inline-block uppercase tracking-[0.15em] font-mono ${selectedService?.id === srv.id ? "text-neutral-800" : "text-accent"}`}>
                              {srv.duration} min
                            </span>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="font-serif text-sm italic">
                              {srv.price ? `${srv.price} DZD` : t("price_on_request")}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: DATE & TIME SELECTION */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-neutral-400 font-medium flex items-center space-x-1">
                        <CalIcon className="w-3.5 h-3.5 mr-1" />
                        <span>{isRtl ? "اختر التاريخ" : "Sélectionner la date"}</span>
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {next7Days.map((day) => (
                          <button
                            key={day.value}
                            disabled={day.isClosed}
                            onClick={() => {
                              setSelectedDate(day.value);
                              setSelectedTime(""); // Reset selected time
                            }}
                            className={`flex flex-col items-center justify-center p-3.5 min-w-[75px] rounded-none border transition-all duration-300 shrink-0 ${
                              day.isClosed
                                ? "border-white/5 bg-[#050505] text-neutral-700 cursor-not-allowed opacity-40"
                                : selectedDate === day.value
                                ? "bg-white text-black border-white"
                                : "bg-[#0a0a0a] border-white/10 text-neutral-300 hover:border-accent/40"
                            }`}
                          >
                            <span className="text-[9px] uppercase font-bold tracking-[0.15em] font-mono">{day.label.split(" ")[0]}</span>
                            <span className="text-lg font-serif font-bold mt-1">{day.value.split("-")[2]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Slot Picker */}
                    {selectedDate && (
                      <div className="space-y-2.5">
                        <label className="text-xs uppercase tracking-widest text-neutral-400 font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>{isRtl ? "اختر الوقت" : "Sélectionner l'heure"}</span>
                        </label>
                        {timeSlots.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map((slot) => {
                              const blocked = isSlotBlocked(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={blocked}
                                  onClick={() => setSelectedTime(slot)}
                                  className={`py-3.5 rounded-none text-center font-mono text-xs border transition-all duration-300 relative ${
                                    blocked
                                      ? "bg-[#050505] border-white/5 text-neutral-600 cursor-not-allowed line-through"
                                      : selectedTime === slot
                                      ? "bg-white text-black border-white"
                                      : "bg-[#0a0a0a] border-white/10 text-neutral-300 hover:border-accent/40 cursor-pointer"
                                  }`}
                                  title={blocked ? "Créneau déjà réservé" : "Créneau disponible"}
                                >
                                  <span>{slot}</span>
                                  {blocked && (
                                    <span className="absolute inset-x-0 bottom-1 text-[7px] text-red-500 uppercase font-mono font-bold tracking-widest leading-none block">
                                      Occupé
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 py-4 text-center">
                            {isRtl ? "لا توجد أوقات متاحة لهذا اليوم." : "Aucun créneau disponible pour ce jour."}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: DETAILS */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-neutral-400 mb-4">
                      {isRtl ? "يرجى تأكيد تفاصيل الاتصال لإتمام الحجز بنجاح:" : "Veuillez saisir vos coordonnées de contact :"}
                    </p>

                    {/* Name input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] text-accent font-semibold flex items-center">
                        <User className="w-3.5 h-3.5 mr-1" />
                        <span>{isRtl ? "الاسم الكامل" : "Nom complet"}</span>
                      </label>
                      <input
                        type="text"
                        placeholder={isRtl ? "اسمك الكامل..." : "Jean Dupont..."}
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-3.5 text-white text-sm focus:border-accent/40 focus:outline-none transition-all duration-300"
                        style={{ direction: isRtl ? "rtl" : "ltr" }}
                      />
                    </div>

                    {/* Phone input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-[0.15em] text-accent font-semibold flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1" />
                        <span>{isRtl ? "رقم الهاتف" : "Numéro de téléphone"}</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+213..."
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-none px-4 py-3.5 text-white text-sm font-mono focus:border-accent/40 focus:outline-none transition-all duration-300"
                        style={{ direction: "ltr" }}
                      />
                    </div>

                    {/* Luxury reservation summary card */}
                    <div className="mt-6 p-4 bg-[#0a0a0a] border border-white/10 rounded-none space-y-3">
                      <h5 className="text-[10px] uppercase tracking-[0.15em] text-accent font-bold border-b border-white/5 pb-2">
                        {isRtl ? "ملخص الحجز الفاخر" : "Récapitulatif de votre rendez-vous"}
                      </h5>
                      <div className="flex justify-between text-xs text-neutral-300">
                        <span>{isRtl ? "الخدمة" : "Prestation"} :</span>
                        <span className="font-serif text-white">{tText(selectedService?.title)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-300">
                        <span>{isRtl ? "التاريخ والوقت" : "Date & Heure"} :</span>
                        <span className="font-serif text-accent">
                          {selectedDate.split("-").reverse().join("/")} @ {selectedTime}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-300">
                        <span>{isRtl ? "المدة" : "Durée"} :</span>
                        <span>{selectedService?.duration} min</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* SUCCESS SCREEN */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-accent" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif text-white uppercase tracking-wide">
                    {isRtl ? "تم تسجيل حجزك بنجاح" : "Réservation validée !"}
                  </h2>
                  <p className="text-xs text-neutral-400 font-serif italic max-w-sm mx-auto">
                    {isRtl
                      ? "يسعدنا استقبالك في صالون حلاقة هيثم. لقد سجلنا موعدك بنجاح في قاعدة البيانات."
                      : "Nous serons ravis de vous accueillir chez Haytem Barber. Votre rendez-vous est officiellement réservé."}
                  </p>
                </div>

                <div className="p-4 bg-[#0a0a0a] border border-white/10 rounded-none text-left max-w-sm mx-auto space-y-2.5">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{isRtl ? "الاسم" : "Client"} :</span>
                    <span className="text-white font-medium">{clientName}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{isRtl ? "الخدمة" : "Prestation"} :</span>
                    <span className="text-white font-serif">{bookingDetails?.serviceName}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{isRtl ? "التاريخ" : "Date"} :</span>
                    <span className="text-accent font-serif">{bookingDetails?.date.split("-").reverse().join("/")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{isRtl ? "الوقت" : "Heure"} :</span>
                    <span className="text-accent font-serif">{bookingDetails?.time}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{isRtl ? "السعر" : "Tarif"} :</span>
                    <span className="text-white font-serif italic">
                      {bookingDetails?.price ? `${bookingDetails?.price} DZD` : t("price_on_request")}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col space-y-2.5 max-w-sm mx-auto">
                  <button
                    onClick={handleWhatsAppRedirect}
                    className="w-full flex items-center justify-center space-x-2 bg-white text-black hover:bg-transparent hover:text-white border border-white px-5 py-4 rounded-none font-bold tracking-[0.15em] uppercase transition-all duration-300 text-xs shadow-lg"
                    id="whatsapp-confirm-btn"
                  >
                    <MessageSquare className="w-4 h-4 mr-1 text-accent" />
                    <span>{isRtl ? "تأكيد عبر الواتساب" : "Envoyer une confirmation WhatsApp"}</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      // Reset modal state
                      setStep(1);
                      setSelectedService(null);
                      setSelectedDate("");
                      setSelectedTime("");
                      setClientName("");
                      setClientPhone("");
                      setSuccess(false);
                    }}
                    className="w-full py-3 text-xs text-neutral-400 hover:text-accent uppercase tracking-[0.15em] font-bold"
                    id="booking-done-btn"
                  >
                    {isRtl ? "إغلاق" : "Fermer la fenêtre"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        {!success && (
          <div className="p-6 border-t border-white/10 bg-black/60 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                className="px-5 py-3 rounded-none border border-white/10 text-neutral-400 hover:text-accent hover:border-accent/40 hover:bg-white/5 transition-all duration-300 text-xs font-semibold uppercase tracking-[0.15em]"
                id="booking-prev-btn"
              >
                {isRtl ? "السابق" : "Précédent"}
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center space-x-1.5 bg-white border border-white text-black hover:bg-transparent hover:text-white px-6 py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300"
                id="booking-next-btn"
              >
                <span>{isRtl ? "التالي" : "Suivant"}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-white border border-white text-black hover:bg-transparent hover:text-white disabled:bg-neutral-800 disabled:text-neutral-500 px-7 py-3.5 rounded-none text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300"
                id="booking-submit-btn"
              >
                {isSubmitting ? (isRtl ? "جاري الإرسال..." : "Validation...") : (isRtl ? "تأكيد الحجز" : "Confirmer")}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
