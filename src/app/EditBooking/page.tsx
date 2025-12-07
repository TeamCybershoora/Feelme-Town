  "use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  Save,
  Users,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Info,
  ClipboardList,
  ChevronDown,
  Check,
} from "lucide-react";
import MoviesModal from "@/components/MoviesModal";

type ServiceItem = {
  id?: string;
  name: string;
  price?: number;
  quantity?: number;
};

type OccasionOption = {
  _id: string;
  occasionId?: string;
  name: string;
  requiredFields: string[];
  fieldLabels: Record<string, string>;
  icon?: string;
  isActive?: boolean;
  includeInDecoration?: boolean;
};

type BookingFormState = {
  bookingId: string;
  mongoId?: string;
  customerName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  theaterName: string;
  date: string;
  time: string;
  numberOfPeople: number;
  occasion: string;
  occasionPersonName: string;
  occasionData: Record<string, string>;
  notes: string;
  adminNotes: string;
  status: string;
  paymentStatus: string;
  venuePaymentMethod: string;
  totalAmount: string;
  advancePayment: string;
  venuePayment: string;
  paidBy: string;
  paidAt: string;
  bookingType: string;
  isManualBooking: boolean;
  createdBy: string;
  staffName: string;
  staffId: string;
  selectedMovies: ServiceItem[];
  selectedCakes: ServiceItem[];
  selectedDecorItems: ServiceItem[];
  selectedGifts: ServiceItem[];
  selectedExtraAddOns: ServiceItem[];
  pricingData: Record<string, unknown> | null;
};

const emptyForm: BookingFormState = {
  bookingId: "",
  customerName: "",
  email: "",
  phone: "",
  whatsappNumber: "",
  theaterName: "",
  date: "",
  time: "",
  numberOfPeople: 2,
  occasion: "",
  occasionPersonName: "",
  occasionData: {},
  notes: "",
  adminNotes: "",
  status: "pending",
  paymentStatus: "unpaid",
  venuePaymentMethod: "online",
  totalAmount: "",
  advancePayment: "",
  venuePayment: "",
  paidBy: "",
  paidAt: "",
  bookingType: "online",
  isManualBooking: false,
  createdBy: "",
  staffName: "",
  staffId: "",
  selectedMovies: [],
  selectedCakes: [],
  selectedDecorItems: [],
  selectedGifts: [],
  selectedExtraAddOns: [],
  pricingData: null,
};

const statusOptions = [
  "pending",
  "manual",
  "confirmed",
  "completed",
  "cancelled",
  "incomplete",
];

const paymentStatusOptions = ["unpaid", "paid", "partial", "refunded"];

const paymentMethodOptions = ["online", "cash", "upi", "card", "bank-transfer"];
const bookingTypeOptions = ["online", "manual", "admin"];

const toDisplayLabel = (value: string) =>
  value
    .split(/[-_]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatCurrencyInput = (value: string | number) => {
  if (typeof value === "number") return value.toString();
  if (!value) return "";
  return value;
};

const normalizePhone = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/[^\d]/g, "");
};

const normalizeItem = (raw: any): ServiceItem => {
  if (!raw) {
    return { name: "", quantity: 1, price: undefined };
  }

  if (typeof raw === "string") {
    return { name: raw, quantity: 1 };
  }

  return {
    id: raw.id || raw.itemId || raw._id || undefined,
    name: raw.name || raw.title || raw.displayName || raw.itemName || "",
    price:
      typeof raw.price === "number"
        ? raw.price
        : raw.price
        ? Number(raw.price)
        : raw.amount
        ? Number(raw.amount)
        : undefined,
    quantity:
      raw.quantity && Number(raw.quantity) > 0
        ? Number(raw.quantity)
        : raw.qty && Number(raw.qty) > 0
        ? Number(raw.qty)
        : 1,
  };
};

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const verboseMatch = trimmed.match(
    /^(?:[A-Za-z]+\s*,\s*)?([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/i
  );
  if (verboseMatch) {
    const [, monthName, day, year] = verboseMatch;
    const months: Record<string, number> = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };
    const monthIndex = months[monthName.toLowerCase()];
    if (typeof monthIndex === "number") {
      return new Date(Number(year), monthIndex, Number(day));
    }
  }

  const sanitized = trimmed.replace(/^[A-Za-z]+\s*,\s*/, "").split(" at ")[0]?.trim();
  if (sanitized) {
    const fallback = new Date(sanitized);
    if (!Number.isNaN(fallback.getTime())) {
      return new Date(
        fallback.getFullYear(),
        fallback.getMonth(),
        fallback.getDate()
      );
    }
  }
  return null;
};

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForStorageValue = (isoDate?: string): string | undefined => {
  if (!isoDate) return undefined;
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [yearStr, monthStr, dayStr] = parts;
  const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  if (Number.isNaN(dateObj.getTime())) {
    return isoDate;
  }
  return dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeTimeToken = (token?: string) => {
  if (!token) return undefined;
  const trimmed = token.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) {
    return trimmed.toUpperCase();
  }
  let hour = Number(match[1]);
  const minutes = match[2] ? String(match[2]).padStart(2, "0") : "00";
  const period = match[3].toUpperCase();
  if (hour === 0) hour = 12;
  if (hour > 12) hour = hour % 12 || 12;
  const hourStr = String(hour);
  return `${hourStr}:${minutes} ${period}`;
};

const formatTimeForStorageValue = (time?: string): string | undefined => {
  if (!time) return undefined;
  const trimmed = time.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("-")) {
    const [startRaw, endRaw] = trimmed.split("-").map((part) => part.trim());
    const start = normalizeTimeToken(startRaw);
    const end = normalizeTimeToken(endRaw);
    if (start && end) {
      return `${start} - ${end}`;
    }
  }
  const normalized = normalizeTimeToken(trimmed);
  return normalized || trimmed;
};

type CustomOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

const formatINRCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const StyledDropdown = ({
  value,
  options,
  onChange,
  placeholder = "Select option",
  disabled = false,
}: {
  value: string;
  options: CustomOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((opt) => opt.value === value)
    )
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();

  useEffect(() => {
    setHighlightedIndex((prev) => {
      const nextIndex = options.findIndex((opt) => opt.value === value);
      if (nextIndex === -1) {
        return Math.min(prev, options.length - 1);
      }
      return nextIndex;
    });
  }, [value, options]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !(event.target instanceof Node)) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [open, highlightedIndex]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const findNextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    if (options.length === 0) return -1;
    let nextIndex = startIndex;
    for (let i = 0; i < options.length; i += 1) {
      nextIndex = (nextIndex + direction + options.length) % options.length;
      if (!options[nextIndex]?.disabled) {
        return nextIndex;
      }
    }
    return startIndex;
  };

  const cycleHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((prev) => {
      if (prev === -1) {
        const initial = direction === 1 ? -1 : 0;
        const firstEnabled = findNextEnabledIndex(initial, direction);
        return firstEnabled;
      }
      const nextIndex = findNextEnabledIndex(prev, direction);
      return nextIndex;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      cycleHighlight(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && highlightedIndex >= 0) {
        selectValue(options[highlightedIndex].value);
      } else {
        setOpen((prev) => !prev);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const selected = options.find((opt) => opt.value === value);

  return (
    <div
      className={`styled-dropdown ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="styled-dropdown__toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <div className="styled-dropdown__value">
          {selected?.icon && <span className="option-icon">{selected.icon}</span>}
          <span>{selected?.label || placeholder}</span>
        </div>
        <ChevronDown size={16} aria-hidden className="chevron" />
      </button>

      <ul
        id={listId}
        className="styled-dropdown__list"
        role="listbox"
        aria-activedescendant={
          highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined
        }
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const isActive = highlightedIndex === index;
          const isBookedLabel =
            typeof option.label === "string" && option.label.toLowerCase().startsWith("slot booked");
          const isGoingLabel =
            typeof option.label === "string" && option.label.toLowerCase().startsWith("time gone");
          return (
            <li key={option.value}>
              <button
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                className={`styled-dropdown__option ${isSelected ? "selected" : ""} ${
                  isActive ? "active" : ""
                } ${option.disabled ? "disabled" : ""} ${isBookedLabel ? "booked" : ""} ${
                  isGoingLabel ? "going" : ""
                }`}
                aria-disabled={option.disabled || undefined}
                disabled={option.disabled}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  if (!option.disabled) {
                    selectValue(option.value);
                  }
                }}
              >
                <div className="option-content">
                  {option.icon && <span className="option-icon">{option.icon}</span>}
                  <span className="option-label">{option.label}</span>
                </div>
                {isSelected && <Check size={16} className="option-check" />}
              </button>
            </li>
          );
        })}
      </ul>
      <style jsx>{`
        .styled-dropdown { position: relative; }
        .styled-dropdown__toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; background: var(--input-bg); color: var(--input-text); border: 1px solid var(--card-border); border-radius: 10px; padding: 10px 12px; }
        .styled-dropdown__list { margin-top: 8px; background: #0f0f0f; border: 1px solid var(--card-border); border-radius: 10px; padding: 6px; max-height: 280px; overflow-y: auto; }
        .styled-dropdown__option { width: 100%; text-align: left; border: none; background: transparent; color: var(--text-primary); padding: 10px 12px; border-radius: 8px; cursor: pointer; }
        .styled-dropdown__option.disabled { cursor: not-allowed; opacity: 0.9; }
        .styled-dropdown__option.active { background: rgba(255,255,255,0.06); }
        /* Selected (current choice) in green */
        .styled-dropdown__option.selected, .styled-dropdown__option.selected .option-label { color: #22c55e; }
        .styled-dropdown__option.selected { background: rgba(34,197,94,0.15); }
        /* Booked options in red */
        .styled-dropdown__option.booked .option-label { color: #ef4444; font-weight: 600; }
        .styled-dropdown__option.booked { background: rgba(239,68,68,0.10); }
        /* Time Gone in amber */
        .styled-dropdown__option.going .option-label { color: #f59e0b; font-weight: 600; }
      `}</style>
    </div>
  );
};

const CustomSelect = ({
  value,
  options,
  onChange,
  placeholder = "Select option",
  disabled = false,
}: {
  value: string;
  options: CustomOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((opt) => opt.value === value)
    )
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();

  useEffect(() => {
    setHighlightedIndex((prev) => {
      const nextIndex = options.findIndex((opt) => opt.value === value);
      if (nextIndex === -1) {
        return Math.min(prev, options.length - 1);
      }
      return nextIndex;
    });
  }, [value, options]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !(event.target instanceof Node)) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.focus();
    }
  }, [open, highlightedIndex]);

  const selectValue = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const cycleHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((prev) => {
      if (prev === -1) return 0;
      const nextIndex = (prev + direction + options.length) % options.length;
      return nextIndex;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      cycleHighlight(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && highlightedIndex >= 0) {
        selectValue(options[highlightedIndex].value);
      } else {
        setOpen((prev) => !prev);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const selected = options.find((opt) => opt.value === value);

  return (
    <div
      className={`custom-select ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="custom-select__toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <div className="custom-select__value">
          {selected?.icon && <span className="option-icon">{selected.icon}</span>}
          <span>{selected?.label || placeholder}</span>
        </div>
        <ChevronDown size={16} aria-hidden className="chevron" />
      </button>

      <ul
        id={listId}
        className="custom-select__list"
        role="listbox"
        aria-activedescendant={
          highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined
        }
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const isActive = highlightedIndex === index;
          return (
            <li key={option.value}>
              <button
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                className={`custom-select__option ${isSelected ? "selected" : ""} ${
                  isActive ? "active" : ""
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectValue(option.value)}
              >
                <div className="option-content">
                  {option.icon && <span className="option-icon">{option.icon}</span>}
                  <span className="option-label">{option.label}</span>
                </div>
                {isSelected && <Check size={16} className="option-check" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default function EditBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("bookingId");
  const queryEmail = searchParams.get("email");
  const queryPhone = searchParams.get("phone");
  const queryMongoId = searchParams.get("mongoId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormState>(emptyForm);
  const [originalBooking, setOriginalBooking] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<OccasionOption[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<Record<string, unknown> | null>(null);
  const [decorationEnabled, setDecorationEnabled] = useState(false);
  const [activeService, setActiveService] = useState<any | null>(null);
  const [showMoviesModal, setShowMoviesModal] = useState(false);
  const loadedOccasionRef = useRef<string | null>(null);
  const [editorMeta, setEditorMeta] = useState<{
    role: "admin" | "staff" | "unknown";
    name?: string;
    id?: string;
  }>({ role: "unknown" });

  const selectedOccasion = useMemo(() => {
    if (!formData.occasion) return null;
    return (
      occasions.find(
        (occ) =>
          occ.name === formData.occasion ||
          occ.occasionId === formData.occasion ||
          occ._id === formData.occasion
      ) || null
    );
  }, [formData.occasion, occasions]);

  const firstOccasionFieldKey = useMemo(() => {
    if (!selectedOccasion || !Array.isArray(selectedOccasion.requiredFields)) return null;
    return selectedOccasion.requiredFields.length > 0 ? selectedOccasion.requiredFields[0] : null;
  }, [selectedOccasion]);

  const secondOccasionFieldKey = useMemo(() => {
    if (!selectedOccasion || !Array.isArray(selectedOccasion.requiredFields)) return null;
    const arr = selectedOccasion.requiredFields.filter(Boolean);
    return arr.length > 1 ? arr[1] : null;
  }, [selectedOccasion]);

  const appliedDecorationFee = useMemo(() => {
    const raw = (formData.pricingData as any)?.appliedDecorationFee;
    return Number(raw ?? 0) || 0;
  }, [formData.pricingData]);

  const baseDecorationFee = useMemo(() => {
    const source: any = pricingData || formData.pricingData || null;
    if (!source) return 0;
    return Number(source.decorationFees ?? 0) || 0;
  }, [pricingData, formData.pricingData]);

  const shouldApplyDecorationFee = useMemo(() => {
    if (!formData.occasion) return false;
    if (selectedOccasion && selectedOccasion.includeInDecoration === false) return false;
    return decorationEnabled;
  }, [formData.occasion, selectedOccasion, decorationEnabled]);

  const decorationToggleAvailable =
    !!formData.occasion && selectedOccasion?.includeInDecoration !== false;

  const selectedMovieName = useMemo(() => {
    if (!formData.selectedMovies || formData.selectedMovies.length === 0) return "";
    return formData.selectedMovies[0]?.name || "";
  }, [formData.selectedMovies]);

  const handleMovieSelect = (movieTitle: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedMovies: [
        {
          id: movieTitle.toLowerCase().replace(/\s+/g, "_"),
          name: movieTitle,
          price: 0,
          quantity: 1,
        },
      ],
    }));
    setShowMoviesModal(false);
  };

  const selectedTheaterRecord = useMemo(() => {
    if (!formData.theaterName) return null;
    return (
      theaters.find(
        (theater: any) =>
          theater.name === formData.theaterName || theater.theaterId === formData.theaterName
      ) || null
    );
  }, [formData.theaterName, theaters]);

  const theaterCapacity = useMemo(() => {
    const fallback = { min: 1, max: 20 };
    if (!selectedTheaterRecord || !selectedTheaterRecord.capacity) return fallback;
    const { capacity } = selectedTheaterRecord;
    if (
      typeof capacity === "object" &&
      typeof capacity.min === "number" &&
      typeof capacity.max === "number"
    ) {
      return { min: Math.max(1, capacity.min), max: Math.max(capacity.min, capacity.max) };
    }
    return fallback;
  }, [selectedTheaterRecord]);

  const numberOfPeopleOptions = useMemo(() => {
    const { max } = theaterCapacity;
    const options: CustomOption[] = [];
    const start = 1;
    for (let i = start; i <= max; i += 1) {
      options.push({
        value: String(i),
        label: `${i} ${i === 1 ? "Guest" : "Guests"}`,
      });
    }
    return options;
  }, [theaterCapacity]);

  useEffect(() => {
    const { max } = theaterCapacity;
    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      handleInputChange("numberOfPeople", 1);
    } else if (formData.numberOfPeople > max) {
      handleInputChange("numberOfPeople", max);
    }
  }, [theaterCapacity, formData.numberOfPeople]);

  const selectableSlots = useMemo(() => {
    // Show all slots; booked/going will be disabled (except current selection)
    return availableSlots;
  }, [availableSlots]);

  const editorDisplayName = useMemo(() => {
    if (!editorMeta.name) return "";
    if (editorMeta.role === "staff" && editorMeta.id) {
      return `${editorMeta.name} · ID: ${editorMeta.id}`;
    }
    return editorMeta.name;
  }, [editorMeta]);

  const buildFormState = (booking: any): BookingFormState => {
    const parsedDateValue = parseDateValue(booking.date) || parseDateValue(booking.selectedDate);
    const parsedDate = parsedDateValue ? formatDateInputValue(parsedDateValue) : "";

    const normalizedOccasionData: Record<string, string> = {};
    const possibleOccasionFields = [
      "birthdayName",
      "birthdayGender",
      "partner1Name",
      "partner1Gender",
      "partner2Name",
      "partner2Gender",
      "dateNightName",
      "proposerName",
      "proposalPartnerName",
      "valentineName",
      "customCelebration",
      "babyShowerParentName",
      "babyGender",
      "farewellPersonName",
      "farewellReason",
      "congratulationsPersonName",
      "congratulationsReason",
    ];

    possibleOccasionFields.forEach((field) => {
      if (booking[field]) {
        normalizedOccasionData[field] = booking[field];
      }
    });

    if (booking.occasionData && typeof booking.occasionData === "object") {
      Object.assign(normalizedOccasionData, booking.occasionData);
    }

    Object.keys(booking).forEach((key) => {
      if (key.endsWith("_label")) {
        const base = key.replace("_label", "");
        const value = booking[base] || booking[`${base}_value`];
        if (value) {
          const camelKey = base
            .split(" ")
            .map((word, index) =>
              index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join("");
          normalizedOccasionData[camelKey] = value;
        }
      }
    });

    const normalized = {
      bookingId: booking.bookingId || booking.id || booking._id || "",
      mongoId: booking._id ? String(booking._id) : undefined,
      customerName: booking.customerName || booking.name || "",
      email: booking.email || "",
      phone: booking.phone || booking.contactNumber || "",
      whatsappNumber: booking.whatsappNumber || booking.phone || "",
      theaterName: booking.theaterName || booking.theater || "",
      date: parsedDate || "",
      time:
        formatTimeForStorageValue(booking.time || booking.timeSlot || "") ||
        booking.time ||
        booking.timeSlot ||
        "",
      numberOfPeople: booking.numberOfPeople || booking.extraGuestsCount || 2,
      occasion: booking.occasion || "",
      occasionPersonName: booking.occasionPersonName || "",
      occasionData: normalizedOccasionData,
      notes: booking.notes || booking.adminNotes || "",
      adminNotes: booking.adminNotes || "",
      status: booking.status || "pending",
      paymentStatus: booking.paymentStatus || booking.payment_status || "unpaid",
      venuePaymentMethod:
        booking.venuePaymentMethod ||
        booking.paymentMethod ||
        booking.finalPaymentMethod ||
        "online",
      totalAmount: formatCurrencyInput(booking.totalAmount || booking.amount || ""),
      advancePayment: formatCurrencyInput(booking.advancePayment || ""),
      venuePayment: formatCurrencyInput(booking.venuePayment || booking.remainingAmount || ""),
      paidBy: booking.paidBy || "",
      paidAt: booking.paidAt || "",
      bookingType: booking.bookingType || (booking.isManualBooking ? "manual" : "online"),
      isManualBooking: Boolean(
        booking.isManualBooking ||
          booking.bookingType === "manual" ||
          booking.status === "manual"
      ),
      createdBy: booking.createdBy || "",
      staffName: booking.staffName || "",
      staffId: booking.staffId || booking.userId || "",
      selectedMovies: (booking.selectedMovies || []).map(normalizeItem),
      selectedCakes: (booking.selectedCakes || []).map(normalizeItem),
      selectedDecorItems: (booking.selectedDecorItems || []).map(normalizeItem),
      selectedGifts: (booking.selectedGifts || []).map(normalizeItem),
      selectedExtraAddOns: (booking.selectedExtraAddOns || []).map(normalizeItem),
      pricingData: booking.pricingData || null,
    };

    return normalized;
  };

  const fetchTimeSlots = async (theaterName: string, date: string, theaterId?: string) => {
    if (!theaterName || !date) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("theater", theaterName);
      params.set("date", date);
       if (theaterId) {
         params.set("theaterId", theaterId);
       }
      const res = await fetch(`/api/time-slots-with-bookings?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.timeSlots)) {
        setAvailableSlots(data.timeSlots);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    const theaterId = selectedTheaterRecord?.theaterId || selectedTheaterRecord?._id;
    fetchTimeSlots(formData.theaterName, formData.date, theaterId ? String(theaterId) : undefined);
  }, [formData.theaterName, formData.date, selectedTheaterRecord]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const staffUserRaw = localStorage.getItem("staffUser");
      if (staffUserRaw) {
        try {
          const staffUser = JSON.parse(staffUserRaw);
          const staffName = staffUser.name || staffUser.staffName || "Staff Member";
          const staffId = staffUser.userId || staffUser.staffId || staffUser.id || "N/A";
          setEditorMeta({ role: "staff", name: staffName, id: staffId });
          return;
        } catch {
          setEditorMeta({ role: "staff", name: "Staff Member", id: "N/A" });
          return;
        }
      }

      const adminUserRaw = localStorage.getItem("adminUser");
      if (adminUserRaw) {
        try {
          const adminUser = JSON.parse(adminUserRaw);
          const adminName = adminUser.fullName || adminUser.name || "Administrator";
          const adminId = adminUser.adminId || adminUser.id || adminUser._id;
          setEditorMeta({
            role: "admin",
            name: adminName,
            id: adminId ? String(adminId) : undefined,
          });
          return;
        } catch {
          // Fall through to token check
        }
      }

      const adminToken = localStorage.getItem("adminToken");
      if (adminToken === "authenticated") {
        setEditorMeta({ role: "admin", name: "Administrator" });
      } else {
        setEditorMeta({ role: "unknown" });
      }
    } catch {
      setEditorMeta({ role: "unknown" });
    }
  }, []);

  const loadInitialData = async () => {
    if (!queryBookingId && !queryMongoId && !queryEmail && !queryPhone) {
      setError("Missing booking identifier. Provide bookingId, mongoId, email, or phone.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        bookingRes,
        adminBookingsRes,
        manualBookingsRes,
        servicesRes,
        theatersRes,
        occasionsRes,
        pricingRes,
      ] = await Promise.all([
        queryBookingId
          ? fetch(
              `/api/booking/${encodeURIComponent(
                queryBookingId
              )}/decompress${queryEmail ? `?email=${encodeURIComponent(queryEmail)}` : ""}`,
              { cache: "no-store" }
            ).catch(() => null)
          : Promise.resolve(null),
        fetch("/api/admin/bookings").catch(() => null),
        fetch("/api/admin/manual-bookings").catch(() => null),
        fetch("/api/admin/services?includeInactive=true").catch(() => null),
        fetch("/api/admin/theaters").catch(() => null),
        fetch("/api/occasions").catch(() => null),
        fetch("/api/pricing").catch(() => null),
      ]);

      const bookingDetail = bookingRes ? await bookingRes.json().catch(() => null) : null;
      const adminBookings = adminBookingsRes ? await adminBookingsRes.json().catch(() => null) : null;
      const manualBookings = manualBookingsRes
        ? await manualBookingsRes.json().catch(() => null)
        : null;
      const servicesData = servicesRes ? await servicesRes.json().catch(() => null) : null;
      const theatersData = theatersRes ? await theatersRes.json().catch(() => null) : null;
      const occasionsData = occasionsRes ? await occasionsRes.json().catch(() => null) : null;
      const pricing = pricingRes ? await pricingRes.json().catch(() => null) : null;

      setServices(Array.isArray(servicesData?.services) ? servicesData.services : []);
      setTheaters(Array.isArray(theatersData?.theaters) ? theatersData.theaters : []);
      setOccasions(Array.isArray(occasionsData?.occasions) ? occasionsData.occasions : []);
      setPricingData(pricing?.pricing || null);

      const allAdmin = Array.isArray(adminBookings?.bookings) ? adminBookings.bookings : [];
      const allManual = Array.isArray(manualBookings?.manualBookings)
        ? manualBookings.manualBookings
        : manualBookings?.bookings || [];
      const combined = [...allAdmin, ...allManual];

      let targetBooking: any = null;

      if (bookingDetail?.success && bookingDetail.booking) {
        targetBooking = bookingDetail.booking;
      }

      if (!targetBooking && queryBookingId) {
        targetBooking = combined.find(
          (b) =>
            String(b.bookingId || b.id || b._id) === queryBookingId ||
            String(b._id || "") === queryMongoId
        );
      }

      if (!targetBooking && queryMongoId) {
        targetBooking = combined.find((b) => String(b._id || "") === queryMongoId);
      }

      if (!targetBooking && (queryPhone || queryEmail)) {
        targetBooking = combined.find((b) => {
          const phoneMatch =
            queryPhone &&
            normalizePhone(b.phone || b.whatsappNumber) === normalizePhone(queryPhone);
          const emailMatch =
            queryEmail && (b.email || "").toLowerCase() === queryEmail.toLowerCase();
          return phoneMatch || emailMatch;
        });
      }

      if (!targetBooking) {
        throw new Error("Booking not found. Please verify the identifier.");
      }

      setOriginalBooking(targetBooking);
      setFormData(buildFormState(targetBooking));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load booking details. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryBookingId, queryEmail, queryPhone, queryMongoId]);

  useEffect(() => {
    if (!formData.paymentStatus) return;
    const paidStates = formData.paymentStatus === "paid" || formData.paymentStatus === "partial";

    if (paidStates) {
      if (!editorMeta.name) return;
      const nextPaidBy =
        editorMeta.role === "staff" && editorMeta.name
          ? editorMeta.name
          : editorMeta.name || "Administrator";
      if (nextPaidBy && formData.paidBy !== nextPaidBy) {
        handleInputChange("paidBy", nextPaidBy);
      }
      return;
    }

    if (!paidStates && formData.paidBy) {
      handleInputChange("paidBy", "");
    }
  }, [formData.paymentStatus, editorMeta, formData.paidBy]);

  useEffect(() => {
    const p: any = pricingData || formData.pricingData || null;
    if (!p) return;
    const targetFee = shouldApplyDecorationFee ? baseDecorationFee : 0;
    const prevApplied = Number((formData.pricingData as any)?.appliedDecorationFee ?? 0) || 0;
    if (prevApplied === targetFee) return;
    const currentTotal = Number(formData.totalAmount || 0) || 0;
    const nextTotal = currentTotal - prevApplied + targetFee;
    setFormData((prev) => ({
      ...prev,
      totalAmount: String(Number.isFinite(nextTotal) ? nextTotal : 0),
      pricingData: {
        ...(prev.pricingData || {}),
        decorationFees: baseDecorationFee,
        appliedDecorationFee: targetFee,
      },
    }));
  }, [baseDecorationFee, shouldApplyDecorationFee, pricingData, formData.totalAmount, formData.pricingData]);

  useEffect(() => {
    if (loadedOccasionRef.current === formData.occasion) return;
    loadedOccasionRef.current = formData.occasion || null;
    if (!formData.occasion || (selectedOccasion && selectedOccasion.includeInDecoration === false)) {
      setDecorationEnabled(false);
      return;
    }
    const appliedFee = Number((formData.pricingData as any)?.appliedDecorationFee ?? 0) || 0;
    setDecorationEnabled(appliedFee > 0);
  }, [formData.occasion, selectedOccasion, formData.pricingData]);

  useEffect(() => {
    if (!firstOccasionFieldKey) return;
    const current = formData.occasionData[firstOccasionFieldKey] || "";
    if ((formData.occasionPersonName || "") !== current) {
      handleInputChange("occasionPersonName", current);
    }
  }, [firstOccasionFieldKey, formData.occasionData, formData.occasionPersonName]);

  const handleInputChange = (
    field: keyof BookingFormState,
    value: string | number | boolean | ServiceItem[] | Record<string, string> | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOccasionFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      occasionData: {
        ...prev.occasionData,
        [key]: value,
      },
    }));
  };

  const hasChanges = useMemo(() => {
    if (!originalBooking) return false;
    try {
      const current = JSON.stringify(formData);
      const original = JSON.stringify(buildFormState(originalBooking));
      return current !== original;
    } catch {
      return true;
    }
  }, [formData, originalBooking]);

  const handleSave = async () => {
    if (!formData.bookingId) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const originalState = originalBooking ? buildFormState(originalBooking) : null;
      const emailChanged =
        !!originalState &&
        (originalState.email || "").trim().toLowerCase() !== (formData.email || "").trim().toLowerCase();

      const storageDateValue = formatDateForStorageValue(formData.date) ?? formData.date;
      const storageTimeValue = formatTimeForStorageValue(formData.time) ?? formData.time;

      const payload: Record<string, unknown> = {
        bookingId: formData.bookingId,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        venuePaymentMethod: formData.venuePaymentMethod,
        totalAmount: Number(formData.totalAmount) || 0,
        advancePayment: Number(formData.advancePayment) || 0,
        venuePayment: Number(formData.venuePayment) || 0,
        paidBy: formData.paidBy || null,
        paidAt: formData.paidAt || null,
        name: formData.customerName,
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber || formData.phone,
        theaterName: formData.theaterName,
        date: storageDateValue,
        time: storageTimeValue,
        numberOfPeople: formData.numberOfPeople,
        occasion: formData.occasion,
        occasionPersonName: formData.occasionPersonName,
        occasionData: formData.occasionData,
        notes: formData.notes,
        adminNotes: formData.adminNotes,
        bookingType: formData.bookingType,
        isManualBooking: formData.isManualBooking,
        createdBy: formData.createdBy,
        staffName: formData.staffName,
        staffId: formData.staffId,
        selectedMovies: formData.selectedMovies,
        selectedCakes: formData.selectedCakes,
        selectedDecorItems: formData.selectedDecorItems,
        selectedGifts: formData.selectedGifts,
        selectedExtraAddOns: formData.selectedExtraAddOns,
        pricingData: formData.pricingData || pricingData || undefined,
        sendInvoice: formData.paymentStatus === "paid",
        resendConfirmationEmail: emailChanged,
      };

      const res = await fetch("/api/admin/update-booking", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update booking");
      }

      setSaveMessage("Booking updated successfully.");
      setOriginalBooking(data.booking || originalBooking);
      if (data.booking) {
        setFormData(buildFormState(data.booking));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save booking changes.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const renderOccasionFields = () => {
    if (!selectedOccasion) return null;
    return (
      <div className="dynamic-fields">
        {selectedOccasion.requiredFields
          .filter((key) => !firstOccasionFieldKey || key !== firstOccasionFieldKey)
          .filter((key) => !secondOccasionFieldKey || key !== secondOccasionFieldKey)
          .map((fieldKey) => {
          const label = selectedOccasion.fieldLabels?.[fieldKey] || fieldKey;
          return (
            <div
              className={`form-control required ${
                !(formData.occasionData[fieldKey] || "").trim() ? "invalid" : ""
              }`}
              key={fieldKey}
            >
              <label>{label}</label>
              <input
                type="text"
                value={formData.occasionData[fieldKey] || ""}
                onChange={(e) => handleOccasionFieldChange(fieldKey, e.target.value)}
                required
                aria-required="true"
                aria-invalid={!(formData.occasionData[fieldKey] || "").trim()}
                className={`${!(formData.occasionData[fieldKey] || "").trim() ? "invalid" : "valid"}`}
              />
              {!(formData.occasionData[fieldKey] || "").trim() && (
                <small className="validation-hint">Required</small>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="edit-booking-page">
      <div className="page-header">
        <button type="button" className="ghost-btn" onClick={() => router.back()}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="header-titles">
          <h1>Edit Booking</h1>
          <div className="meta-row">
            <p className="muted">
              {formData.bookingId ? `Booking ID: ${formData.bookingId}` : "Loading booking..."}
            </p>
            <div className="editor-chip">
              <span className={`badge ${editorMeta.role}`}>
                {editorMeta.role === "staff" ? "Staff Edit" : "Admin Edit"}
              </span>
              {editorMeta.role === "staff" && (
                <span className="editor-details">
                  {editorMeta.name && <strong>{editorMeta.name}</strong>}{" "}
                  {editorMeta.id && <span>· ID: {editorMeta.id}</span>}
                </span>
              )}
              {editorMeta.role === "admin" && editorMeta.name && (
                <span className="editor-details">
                  <strong>{editorMeta.name}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={loadInitialData}
            disabled={loading}
            title="Reload booking data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleSave}
            disabled={saving || !formData.bookingId}
          >
            {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <Loader2 className="spin" size={24} />
          Loading booking details...
        </div>
      )}

      {!loading && error && (
        <div className="alert error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && saveMessage && (
        <div className="alert success">
          <CheckCircle2 size={18} />
          <span>{saveMessage}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="edit-layout">
          <div className="edit-main">
            <section className="edit-card">
              <div className="section-header">
                <div>
                  <h3>Booking Status</h3>
                  <p className="section-subtitle">Control the lifecycle and payment tracking.</p>
                </div>
                {hasChanges && <span className="pill">Unsaved changes</span>}
              </div>
              <div className="grid two">
                <div className="form-control">
                  <label>Status</label>
                  <StyledDropdown
                    value={formData.status}
                    options={statusOptions.map((option) => ({
                      value: option,
                      label: option.charAt(0).toUpperCase() + option.slice(1),
                    }))}
                    onChange={(val) => handleInputChange("status", val)}
                    disabled
                  />
                  {formData.date && formData.theaterName && (
                    <div className="capacity-hint">
                      {slotsLoading
                        ? "Checking slot availability..."
                        : availableSlots.length === 0
                        ? "No slots available for the selected theater/date."
                        : "Booked slots are disabled to avoid conflicts."}
                    </div>
                  )}
                </div>
                <div className="form-control">
                  <label>Payment Status</label>
                  <StyledDropdown
                    value={formData.paymentStatus}
                    options={paymentStatusOptions.map((option) => ({
                      value: option,
                      label: option.charAt(0).toUpperCase() + option.slice(1),
                    }))}
                    onChange={(val) => handleInputChange("paymentStatus", val)}
                  />
                </div>
                <div className="form-control">
                  <label>Payment Method</label>
                  <StyledDropdown
                    value={formData.venuePaymentMethod}
                    options={paymentMethodOptions.map((option) => ({
                      value: option,
                      label: option.toUpperCase(),
                    }))}
                    onChange={(val) => handleInputChange("venuePaymentMethod", val)}
                  />
                </div>
                <div className="form-control">
                  <label>Paid By</label>
                  <input
                    type="text"
                    value={formData.paidBy}
                    onChange={(e) => handleInputChange("paidBy", e.target.value)}
                    placeholder="Administrator / Staff name"
                  />
                </div>
              </div>
            </section>

            <section className="edit-card">
              <div className="section-header">
                <div>
                  <h3>
                    <Users size={16} /> Customer & Guests
                  </h3>
                  <p className="section-subtitle">Primary contact + guest counts.</p>
                </div>
              </div>
              <div className="grid two">
                <div className="form-control">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label>Email</label>
                  <div className="input-with-icon">
                    <Mail size={14} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label>Phone</label>
                  <div className="input-with-icon">
                    <Phone size={14} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label>Number of People</label>
                  <StyledDropdown
                    value={String(formData.numberOfPeople)}
                    options={numberOfPeopleOptions}
                    onChange={(val) => handleInputChange("numberOfPeople", Number(val))}
                    placeholder="Select guests"
                    disabled={!numberOfPeopleOptions.length}
                  />
                  <div className="capacity-hint">
                    Capacity: {theaterCapacity.min} – {theaterCapacity.max} guests
                  </div>
                </div>
              </div>
            </section>

            <section className="edit-card">
              <div className="section-header">
                <div>
                  <h3>
                    <Calendar size={16} /> Schedule & Theater
                  </h3>
                  <p className="section-subtitle">Venue, slot, and timing.</p>
                </div>
              </div>
              <div className="grid two">
                <div className="form-control">
                  <label>
                    <MapPin size={14} /> Theater
                  </label>
                  <StyledDropdown
                    value={formData.theaterName}
                    options={[
                      { value: "", label: "Select theater" },
                      ...theaters.map((theater: any) => ({
                        value: theater.name,
                        label: theater.name,
                      })),
                      ...(formData.theaterName &&
                      !theaters.find((t: any) => t.name === formData.theaterName)
                        ? [{ value: formData.theaterName, label: formData.theaterName }]
                        : []),
                    ]}
                    onChange={(val) => handleInputChange("theaterName", val)}
                  />
                </div>
                <div className="form-control">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label>
                    <Clock size={14} /> Time Slot
                  </label>
                  <StyledDropdown
                    value={formData.time}
                    options={[
                      {
                        value: "",
                        label: slotsLoading ? "Loading slots..." : "Select a slot",
                        disabled: true,
                      },
                      ...selectableSlots.map((slot) => {
                        const baseLabel = slot.timeRange || `${slot.startTime} - ${slot.endTime}`;
                        const slotValue = slot.timeRange || slot.startTime;
                        const isBooked = slot.bookingStatus === "booked";
                        const isGoing = slot.bookingStatus === "going";
                        const isCurrent = slotValue === formData.time;

                        // Label rules:
                        // - Current booking's slot: show time only (green via .selected)
                        // - Other booked slots: show 'Slot Booked' only (no time)
                        // - Going slots: show 'Time Gone' only
                        let label = baseLabel;
                        if (!isCurrent && isBooked) {
                          label = `Slot Booked`;
                        } else if (!isCurrent && isGoing) {
                          label = `Time Gone`;
                        }
                        return {
                          value: slotValue,
                          label,
                          // Allow currently selected slot even if marked booked; others are disabled
                          disabled: (isBooked || isGoing) && !isCurrent,
                        };
                      }),
                      ...(formData.time &&
                      !selectableSlots.find(
                        (slot) => slot.timeRange === formData.time || slot.startTime === formData.time
                      )
                        ? [{ value: formData.time, label: formData.time }]
                        : []),
                    ]}
                    onChange={(val) => handleInputChange("time", val)}
                  />
                  {formData.date && formData.theaterName && (
                    <div className="capacity-hint">
                      {slotsLoading
                        ? "Checking slot availability..."
                        : availableSlots.length === 0
                        ? "No slots available for the selected theater/date."
                        : "Booked slots are disabled to avoid conflicts."}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="edit-card">
              <div className="section-header">
                <div>
                  <h3>
                    <Info size={16} /> Occasion & Personalization
                  </h3>
                  <p className="section-subtitle">Occasion-specific data just like the booking popup.</p>
                </div>
              </div>
              <div className="grid two">
                <div className="form-control">
                  <label>Occasion</label>
                  <StyledDropdown
                    value={formData.occasion}
                    options={[
                      { value: "", label: "Select occasion" },
                      ...occasions
                        .filter((occ) => occ.isActive !== false)
                        .map((occ) => ({
                          value: occ.name,
                          label: occ.name,
                        })),
                      ...(formData.occasion &&
                      !occasions.find((occ) => occ.name === formData.occasion)
                        ? [{ value: formData.occasion, label: formData.occasion }]
                        : []),
                    ]}
                    onChange={(val) => handleInputChange("occasion", val)}
                  />
                </div>
                <div
                  className={`form-control ${firstOccasionFieldKey ? "required" : ""} ${
                    firstOccasionFieldKey && !(formData.occasionData[firstOccasionFieldKey] || "").trim()
                      ? "invalid"
                      : ""
                  }`}
                >
                  {firstOccasionFieldKey ? (
                    <>
                      <label>
                        {selectedOccasion?.fieldLabels?.[firstOccasionFieldKey] ||
                          toDisplayLabel(firstOccasionFieldKey)}
                      </label>
                      <input
                        type="text"
                        value={formData.occasionData[firstOccasionFieldKey] || ""}
                        onChange={(e) => handleOccasionFieldChange(firstOccasionFieldKey, e.target.value)}
                        required
                        aria-required="true"
                        aria-invalid={!(formData.occasionData[firstOccasionFieldKey] || "").trim()}
                        className={`${!(formData.occasionData[firstOccasionFieldKey] || "").trim() ? "invalid" : "valid"}`}
                      />
                      {!(formData.occasionData[firstOccasionFieldKey] || "").trim() && (
                        <small className="validation-hint">Required</small>
                      )}
                    </>
                  ) : (
                    <>
                      <label>Occasion Person Name</label>
                      <input
                        type="text"
                        value={formData.occasionPersonName}
                        onChange={(e) => handleInputChange("occasionPersonName", e.target.value)}
                      />
                    </>
                  )}
                </div>
                {secondOccasionFieldKey && (
                  <div
                    className={`form-control required ${
                      !(formData.occasionData[secondOccasionFieldKey] || "").trim() ? "invalid" : ""
                    }`}
                  >
                    <label>
                      {selectedOccasion?.fieldLabels?.[secondOccasionFieldKey] ||
                        toDisplayLabel(secondOccasionFieldKey)}
                    </label>
                    <input
                      type="text"
                      value={formData.occasionData[secondOccasionFieldKey] || ""}
                      onChange={(e) => handleOccasionFieldChange(secondOccasionFieldKey, e.target.value)}
                      required
                      aria-required="true"
                      aria-invalid={!(formData.occasionData[secondOccasionFieldKey] || "").trim()}
                      className={`${!(formData.occasionData[secondOccasionFieldKey] || "").trim() ? "invalid" : "valid"}`}
                    />
                    {!(formData.occasionData[secondOccasionFieldKey] || "").trim() && (
                      <small className="validation-hint">Required</small>
                    )}
                  </div>
                )}
              </div>
              {renderOccasionFields()}
              {decorationToggleAvailable && (
                <div className="decor-toggle">
                  <div>
                    <p className="decor-toggle__label">Decoration Fee</p>
                    <p className="decor-toggle__desc">
                      {decorationEnabled
                        ? "Applied to payment breakdown for this booking."
                        : "Toggle on to include decoration pricing."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`decor-toggle__switch ${decorationEnabled ? "on" : "off"}`}
                    aria-pressed={decorationEnabled}
                    onClick={() => setDecorationEnabled((prev) => !prev)}
                  >
                    <span className="decor-toggle__thumb" />
                  </button>
                </div>
              )}
            </section>

            <section className="edit-card">
              <div className="section-header">
                <div>
                  <h3>
                    <ClipboardList size={16} /> Services & Add-ons
                  </h3>
                  <p className="section-subtitle">
                    Mirrors the booking popup selections. Add/remove cakes, décor, gifts, movies.
                  </p>
                </div>
              </div>
              <div className="service-library simple">
                {services
                  .filter((service) => service?.isActive !== false)
                  .map((service) => (
                    <button
                      key={service._id || service.serviceId || service.name}
                      type="button"
                      className="service-chip"
                      onClick={() => setActiveService(service)}
                    >
                      {service.name}
                    </button>
                  ))}
                <button
                  type="button"
                  className={`service-chip primary ${selectedMovieName ? "with-selection" : ""}`}
                  onClick={() => setShowMoviesModal(true)}
                >
                  {selectedMovieName || "Movies"}
                </button>
                {services.length === 0 && (
                  <div className="service-empty">
                    Services catalog not available. Refresh or add services from admin panel.
                  </div>
                )}
              </div>
            </section>

            <section className="edit-card">
              <div className="section-header">
                <div>
                  <h3>Payment Breakdown</h3>
                  <p className="section-subtitle">Totals, advances, and venue amounts.</p>
                </div>
              </div>
              <div className="grid three">
                <div className="form-control">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange("totalAmount", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label>Advance Payment</label>
                  <input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => handleInputChange("advancePayment", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label>Venue Payment</label>
                  <input
                    type="number"
                    value={formData.venuePayment}
                    onChange={(e) => handleInputChange("venuePayment", e.target.value)}
                  />
                </div>
              </div>
              <div className={`fee-breakdown ${shouldApplyDecorationFee ? "active" : ""}`}>
                <div className="fee-row">
                  <div>
                    <p className="fee-label">Decoration Fee</p>
                    <p className="fee-desc">
                      {shouldApplyDecorationFee
                        ? "Auto-applied from pricing when an occasion is selected."
                        : "Select an occasion to apply decoration pricing."}
                    </p>
                  </div>
                  <span className="fee-value">
                    {formatINRCurrency(shouldApplyDecorationFee ? baseDecorationFee : 0)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <aside className="edit-side">
            <div className="edit-card">
              <div className="section-header">
                <h3>Booking Metadata</h3>
              </div>
              <div className="stack">
                <div className="form-control">
                  <label>Booking Type</label>
                  <StyledDropdown
                    value={formData.bookingType}
                    options={bookingTypeOptions.map((option) => ({
                      value: option,
                      label: toDisplayLabel(option),
                    }))}
                    onChange={(val) => handleInputChange("bookingType", val)}
                    disabled
                  />
                </div>
                <div className="form-control checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isManualBooking}
                      onChange={(e) => handleInputChange("isManualBooking", e.target.checked)}
                      disabled
                    />
                    Manual booking
                  </label>
                </div>
                <div className="form-control">
                  <label>Created By</label>
                  <input
                    type="text"
                    value={formData.createdBy}
                    onChange={(e) => handleInputChange("createdBy", e.target.value)}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label>Staff Name</label>
                  <input
                    type="text"
                    value={formData.staffName}
                    onChange={(e) => handleInputChange("staffName", e.target.value)}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label>Staff ID</label>
                  <input
                    type="text"
                    value={formData.staffId}
                    onChange={(e) => handleInputChange("staffId", e.target.value)}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="edit-card">
              <div className="section-header">
                <h3>Internal Notes</h3>
              </div>
              <textarea
                rows={4}
                value={formData.adminNotes}
                onChange={(e) => handleInputChange("adminNotes", e.target.value)}
              />
            </div>

            <div className="edit-card info-card">
              <h4>Need the popup flow?</h4>
              <p>
                This dedicated page mirrors the booking popup but keeps everything accessible,
                searchable, and auditable for admins and management.
              </p>
              <ul>
                <li>All data loads straight from MongoDB.</li>
                <li>Manual & confirmed bookings share the same editor.</li>
                <li>No sessionStorage tricks or popups required.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {activeService && (
        <div className="service-modal__backdrop" onClick={() => setActiveService(null)}>
          <div
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeService.name} catalog`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="service-modal__header">
              <div>
                <p className="service-modal__eyebrow">Service Catalog</p>
                <h4>{activeService.name}</h4>
                {activeService.description && (
                  <p className="service-modal__description">{activeService.description}</p>
                )}
              </div>
              <button type="button" className="ghost-btn" onClick={() => setActiveService(null)}>
                Close
              </button>
            </div>

            <div className="service-modal__list">
              {Array.isArray(activeService.items) && activeService.items.length > 0 ? (
                activeService.items.map((item: any, index: number) => {
                  const normalizedPrice =
                    typeof item.price === "number"
                      ? item.price
                      : item.price
                      ? Number(item.price)
                      : item.amount
                      ? Number(item.amount)
                      : null;
                  return (
                    <div className="service-modal__item" key={item.id || item._id || index}>
                      <div>
                        <p className="service-modal__item-name">{item.name || item.title || "Untitled"}</p>
                        {item.description && (
                          <p className="service-modal__item-desc">{item.description}</p>
                        )}
                        {item.notes && <p className="service-modal__item-note">{item.notes}</p>}
                      </div>
                      <div className="service-modal__meta">
                        {normalizedPrice !== null && (
                          <span className="service-modal__price">
                            {formatINRCurrency(normalizedPrice)}
                          </span>
                        )}
                        {item.duration && (
                          <span className="service-modal__tag">{item.duration}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="service-modal__empty">No items configured for this service.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {showMoviesModal && (
        <MoviesModal
          isOpen={showMoviesModal}
          onClose={() => setShowMoviesModal(false)}
          onMovieSelect={handleMovieSelect}
          selectedMovies={selectedMovieName ? [selectedMovieName] : []}
        />
      )}

      <style jsx>{`
        .edit-booking-page {
          padding: 24px;
          color: #f5f5f5;
          background: #060606;
          min-height: 100vh;
        }
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .header-titles h1 {
          margin: 0;
        }
        .meta-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        @media (min-width: 600px) {
          .meta-row {
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 16px;
          }
        }
        .editor-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 600;
        }
        .badge.admin {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }
        .badge.staff {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }
        .badge.unknown {
          background: rgba(148, 163, 184, 0.2);
          color: #cbd5f5;
        }
        .editor-details {
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.9rem;
        }
        .header-actions {
          display: flex;
          gap: 12px;
        }
        .ghost-btn,
        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: opacity 0.2s ease;
        }
        .ghost-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #f5f5f5;
        }
        .ghost-btn.danger {
          color: #f87171;
        }
        .primary-btn {
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: white;
        }
        .ghost-btn:disabled,
        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading-state,
        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .loading-state {
          background: rgba(255, 255, 255, 0.05);
        }
        .alert.error {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }
        .alert.success {
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
        }
        .edit-layout {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(280px, 0.8fr);
          gap: 24px;
        }
        @media (max-width: 1100px) {
          .edit-layout {
            grid-template-columns: 1fr;
          }
        }
        .edit-card {
          background: rgba(15, 15, 15, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .section-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
        }
        .section-subtitle {
          margin: 4px 0 0 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.9rem;
        }
        .grid {
          display: grid;
          gap: 16px;
        }
        .grid.two {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .grid.three {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        .form-control {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-control label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .form-control input,
        .form-control select,
        .form-control textarea {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: white;
          font-size: 0.95rem;
        }
        .form-control textarea {
          resize: vertical;
        }
        .form-control.required label::after {
          content: "*";
          margin-left: 4px;
          color: #ef4444;
        }
        .form-control input.invalid,
        .form-control select.invalid,
        .form-control textarea.invalid {
          border-color: rgba(239, 68, 68, 0.85);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }
        .form-control input.valid,
        .form-control select.valid,
        .form-control textarea.valid {
          border-color: rgba(34, 197, 94, 0.6);
        }
        .form-control.required.invalid input {
          background: rgba(239, 68, 68, 0.06);
        }
        .fee-breakdown {
          margin-top: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
        }
        .fee-breakdown.active {
          border-color: rgba(34, 197, 94, 0.35);
          background: rgba(34, 197, 94, 0.06);
        }
        .fee-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .fee-label {
          margin: 0;
          font-weight: 600;
          color: #f5f5f5;
        }
        .fee-desc {
          margin: 2px 0 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.55);
        }
        .fee-value {
          font-weight: 700;
          font-size: 1.1rem;
          color: #fbbf24;
        }
        .validation-hint {
          color: #fca5a5;
          font-size: 0.78rem;
          margin-top: -2px;
        }
        :global(.styled-dropdown) {
          position: relative;
          width: 100%;
        }
        :global(.styled-dropdown__toggle) {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--dropdown-text, #f9fafb);
          font-size: 0.95rem;
          cursor: pointer;
          transition: border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        :global(.styled-dropdown__toggle:hover),
        :global(.styled-dropdown.open .styled-dropdown__toggle) {
          border-color: rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.3);
        }
        :global(.styled-dropdown.disabled .styled-dropdown__toggle) {
          opacity: 0.5;
          cursor: not-allowed;
        }
        :global(.styled-dropdown__value) {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }
        :global(.styled-dropdown__value .option-icon) {
          font-size: 1rem;
        }
        :global(.styled-dropdown .chevron) {
          transition: transform 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        }
        :global(.styled-dropdown.open .chevron) {
          transform: rotate(180deg);
        }
        :global(.styled-dropdown__list) {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          background: rgba(10, 10, 10, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 8px;
          margin: 0;
          list-style: none;
          max-height: 220px;
          overflow-y: auto;
          box-shadow: 0 18px 35px rgba(0, 0, 0, 0.55);
          opacity: 0;
          pointer-events: none;
          transform: translateY(-6px);
          transition: opacity 0.2s ease, transform 0.2s ease;
          z-index: 30;
        }
        :global(.styled-dropdown.open .styled-dropdown__list) {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        :global(.styled-dropdown__option) {
          width: 100%;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.92rem;
          padding: 10px 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        :global(.styled-dropdown__option .option-content) {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        :global(.styled-dropdown__option:hover),
        :global(.styled-dropdown__option.active) {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.95);
        }
        :global(.styled-dropdown__option.selected) {
          background: rgba(34, 197, 94, 0.18);
          color: #bbf7d0;
          font-weight: 700;
        }
        :global(.styled-dropdown__option.booked .option-label) { color: #ef4444; font-weight: 700; }
        :global(.styled-dropdown__option.booked) { background: rgba(239, 68, 68, 0.08); }
        :global(.styled-dropdown__option.going .option-label) { color: #f59e0b; font-weight: 700; }
        :global(.styled-dropdown__option .option-check) {
          color: #a5b4fc;
        }
        .form-control.checkbox {
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }
        .form-control.checkbox input {
          width: 18px;
          height: 18px;
        }
        .input-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 12px;
        }
        .input-with-icon input {
          background: transparent;
          border: none;
          padding: 0;
        }
        .muted {
          color: rgba(255, 255, 255, 0.5);
        }
        .pill {
          padding: 4px 10px;
          background: rgba(236, 72, 153, 0.15);
          border-radius: 999px;
          font-size: 0.85rem;
          color: #f9a8d4;
        }
        .dynamic-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }
        .service-library {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .service-library.simple {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }
        .service-chip {
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.04);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: center;
          transition: border 0.2s ease, background 0.2s ease, color 0.2s ease;
        }
        .service-chip:hover {
          border-color: rgba(34, 197, 94, 0.8);
          background: rgba(34, 197, 94, 0.15);
        }
        .service-chip.primary {
          border-color: rgba(59, 130, 246, 0.8);
          background: rgba(59, 130, 246, 0.15);
        }
        .service-chip.ghost {
          border-style: dashed;
          color: rgba(255, 255, 255, 0.8);
        }
        .item-row {
          display: grid;
          grid-template-columns: minmax(140px, 1fr) 110px 90px 44px;
          gap: 8px;
          margin-top: 10px;
        }
        @media (max-width: 700px) {
          .item-row {
            grid-template-columns: 1fr;
          }
        }
        .ghost-btn:hover,
        .primary-btn:hover {
          opacity: 0.85;
        }
        .stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .info-card ul {
          padding-left: 18px;
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.65);
        }
        .info-card li {
          margin-bottom: 6px;
        }
        .capacity-hint {
          margin-top: 6px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .edit-side .edit-card:last-child {
          margin-bottom: 0;
        }
        .spin {
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
