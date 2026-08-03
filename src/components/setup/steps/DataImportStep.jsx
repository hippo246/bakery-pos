import React from 'react';
// Data Import Step for Setup Wizard
// Import data from templates or backup files with full functionality

import { useState, useCallback, useEffect, useRef } from "react";

const IMPORT_TEMPLATES = [
  { id: 'blank', name: 'Blank Slate', icon: '📄', description: 'Start fresh with no data' },
  { id: 'cafe', name: 'Cafe Template', icon: '☕', description: 'Pre-configured menu, tables, and settings for cafes' },
  { id: 'restaurant', name: 'Restaurant Template', icon: '🍽️', description: 'Restaurant-specific configuration' },
  { id: 'bakery', name: 'Bakery Template', icon: '🥐', description: 'Bakery-specific configuration' }
];

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ['.json', '.csv', '.xlsx'];

// Supported currencies for the downloadable template — drives both the
// column headers (e.g. "Price (€)") and the Excel number format applied
// to price/total cells so the sheet opens already formatted correctly.
const TEMPLATE_CURRENCIES = [
  { code: 'GBP', symbol: '£',  name: 'British Pound',     decimals: 2 },
  { code: 'USD', symbol: '$',  name: 'US Dollar',          decimals: 2 },
  { code: 'EUR', symbol: '€',  name: 'Euro',               decimals: 2 },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee',       decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar',  decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',    decimals: 2 },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',       decimals: 0 },
];

function getCurrency(code) {
  return TEMPLATE_CURRENCIES.find(c => c.code === code) || TEMPLATE_CURRENCIES[0];
}

// Builds an Excel number format string that renders the currency symbol
// literally in the cell (e.g. "£"#,##0.00) so filled-in numbers stay clean
// and locale-independent regardless of the user's system settings.
function currencyNumFmt(currency) {
  const zeros = currency.decimals > 0 ? `.${'0'.repeat(currency.decimals)}` : '';
  return `"${currency.symbol}"#,##0${zeros}`;
}

// Blank starter template the user can download, fill in, and re-upload.
const IMPORT_TEMPLATE_DATA = {
  _instructions: [
    "HOW TO USE THIS TEMPLATE",
    "1. Fill in each section below with your own data.",
    "2. Add or remove rows as needed — keep the same field names.",
    "3. Save the file (JSON format), then return to the setup wizard.",
    "4. Choose 'Upload Backup', upload this file, and click 'Import Data'.",
    "5. Your data will be imported and saved to your CRM cloud account automatically."
  ],
  menuItems: [
    { name: "Cappuccino",   category: "Beverages", price: 4.50, description: "Espresso with steamed milk foam",        available: true },
    { name: "Croissant",    category: "Pastries",  price: 3.25, description: "Buttery, flaky French pastry",           available: true },
    { name: "House Blend",  category: "Beverages", price: 3.00, description: "Smooth medium-roast drip coffee",        available: true }
  ],
  tables: [
    { number: 1, capacity: 2, section: "Window"     },
    { number: 2, capacity: 4, section: "Main Floor"  },
    { number: 3, capacity: 6, section: "Main Floor"  },
    { number: 4, capacity: 2, section: "Patio"       }
  ],
  staff: [
    { name: "Jane Doe",   role: "Barista",        email: "jane@example.com",  phone: "555-0101", startDate: "2023-01-15" },
    { name: "Mark Smith", role: "Shift Manager",  email: "mark@example.com",  phone: "555-0102", startDate: "2022-06-01" }
  ],
  inventory: [
    { item: "Coffee Beans (Arabica)", quantity: 50,  unit: "kg",     reorderLevel: 10 },
    { item: "Whole Milk",             quantity: 30,  unit: "litres", reorderLevel: 5  },
    { item: "Pastry Cups",            quantity: 200, unit: "units",  reorderLevel: 50 }
  ],
  customers: [
    { name: "Alice Johnson", email: "alice@example.com", phone: "555-2001", loyaltyPoints: 120, notes: "Prefers oat milk" },
    { name: "Bob Williams",  email: "bob@example.com",   phone: "555-2002", loyaltyPoints: 45,  notes: ""               }
  ],
  orders: [
    { orderId: "ORD-001", customerEmail: "alice@example.com", tableNumber: 2, items: [{ name: "Cappuccino", qty: 2 }, { name: "Croissant", qty: 1 }], total: 12.25, status: "completed", date: "2024-05-01" },
    { orderId: "ORD-002", customerEmail: "bob@example.com",   tableNumber: 1, items: [{ name: "House Blend", qty: 1 }],                                total: 3.00,  status: "completed", date: "2024-05-02" }
  ]
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Loads the SheetJS library exactly once, no matter how many times this is
// called concurrently (e.g. rapid clicks on "Download Template", or a file
// parse kicking off at the same time as a template download). Without this,
// every call that finds `window.XLSX` missing would inject its own <script>
// tag, causing the library — and whatever callback triggered the load — to
// run once per injected tag.
let xlsxLoadPromise = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve();
  if (!xlsxLoadPromise) {
    xlsxLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.onload = () => resolve();
      script.onerror = () => {
        xlsxLoadPromise = null; // allow a retry on next call
        reject(new Error('Failed to load XLSX library'));
      };
      document.head.appendChild(script);
    });
  }
  return xlsxLoadPromise;
}

function downloadTemplateFile(currencyCode = 'GBP') {
  const currency = getCurrency(currencyCode);
  const priceFmt = currencyNumFmt(currency);

  const build = () => {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();

    // ── Shared style tokens ──────────────────────────────────────────────────
    const BRAND     = "795229"; // rich brown
    const BRAND_MID = "A0522D"; // sienna
    const ACCENT_BG = "FDF6EE"; // warm cream
    const HEADER_FG = "FFFFFF";
    const ALT_ROW   = "FDF6EE";
    const BORDER_COLOR = "D9C5B2";
    const NOTE_FG   = "8B6347";

    const border = (color = BORDER_COLOR) => ({
      top:    { style: "thin", color: { rgb: color } },
      bottom: { style: "thin", color: { rgb: color } },
      left:   { style: "thin", color: { rgb: color } },
      right:  { style: "thin", color: { rgb: color } }
    });

    const headerCell = (value) => ({
      v: value, t: "s",
      s: {
        font:      { bold: true, color: { rgb: HEADER_FG }, name: "Calibri", sz: 11 },
        fill:      { fgColor: { rgb: BRAND } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border:    border("FFFFFF")
      }
    });

    const dataCell = (value, type = "s", altRow = false, fmt = null) => {
      const cell = {
        v: value, t: type,
        s: {
          font:      { name: "Calibri", sz: 10, color: { rgb: "2D2D2D" } },
          fill:      { fgColor: { rgb: altRow ? ALT_ROW : "FFFFFF" } },
          alignment: { vertical: "center", wrapText: false },
          border:    border()
        }
      };
      if (fmt) cell.z = fmt;
      return cell;
    };

    const noteCell = (value) => ({
      v: value, t: "s",
      s: {
        font:      { italic: true, color: { rgb: NOTE_FG }, name: "Calibri", sz: 9 },
        fill:      { fgColor: { rgb: ACCENT_BG } },
        alignment: { horizontal: "left", vertical: "center" },
        border:    border(BORDER_COLOR)
      }
    });

    // ── Helper: build a sheet from a config ─────────────────────────────────
    //   config.headers  – [{ label, width, note? }]
    //   config.rows     – array of arrays (raw values, same order as headers)
    const buildSheet = ({ headers, rows }) => {
      const ws = {};
      const R = rows.length + 2; // header row + note row + data rows
      const C = headers.length;

      // Row 1 – header
      headers.forEach((h, ci) => {
        const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
        ws[addr] = headerCell(h.label);
      });

      // Row 2 – column notes (light italic hints)
      headers.forEach((h, ci) => {
        const addr = XLSX.utils.encode_cell({ r: 1, c: ci });
        ws[addr] = noteCell(h.note || "");
      });

      // Data rows starting at row 3
      rows.forEach((row, ri) => {
        const alt = ri % 2 === 1;
        row.forEach((val, ci) => {
          const addr = XLSX.utils.encode_cell({ r: ri + 2, c: ci });
          const h    = headers[ci];
          const type = typeof val === "number" ? "n" : "s";
          ws[addr]   = dataCell(val, type, alt, h.fmt || null);
        });
      });

      ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(R - 1, 2), c: C - 1 } });

      // Column widths
      ws["!cols"] = headers.map(h => ({ wch: h.width || 18 }));

      // Freeze header + note rows
      ws["!freeze"] = { xSplit: 0, ySplit: 2 };

      // Row heights: header=24, notes=18, data=20
      ws["!rows"] = [{ hpt: 24 }, { hpt: 18 }, ...rows.map(() => ({ hpt: 20 }))];

      return ws;
    };

    // ── Sheet definitions ────────────────────────────────────────────────────
    const sheets = [
      {
        name: "📋 Menu Items",
        ws: buildSheet({
          headers: [
            { label: "Name",        width: 22, note: "e.g. Cappuccino"       },
            { label: "Category",    width: 16, note: "e.g. Beverages"        },
            { label: `Price (${currency.symbol})`, width: 13, note: `Numbers only, in ${currency.code}`, fmt: priceFmt },
            { label: "Description", width: 36, note: "Short description"     },
            { label: "Available",   width: 13, note: "TRUE or FALSE"         },
          ],
          rows: [
            ["Cappuccino",  "Beverages", 4.50, "Espresso with steamed milk foam", "TRUE" ],
            ["Croissant",   "Pastries",  3.25, "Buttery, flaky French pastry",    "TRUE" ],
            ["House Blend", "Beverages", 3.00, "Smooth medium-roast drip coffee", "TRUE" ],
          ]
        })
      },
      {
        name: "🪑 Tables",
        ws: buildSheet({
          headers: [
            { label: "Table No.",  width: 13, note: "Unique number"      },
            { label: "Capacity",   width: 13, note: "Seats"              },
            { label: "Section",    width: 20, note: "e.g. Main Floor"    },
          ],
          rows: [
            [1, 2, "Window"    ],
            [2, 4, "Main Floor"],
            [3, 6, "Main Floor"],
            [4, 2, "Patio"     ],
          ]
        })
      },
      {
        name: "👥 Staff",
        ws: buildSheet({
          headers: [
            { label: "Full Name",   width: 22, note: "First and last name"    },
            { label: "Role",        width: 18, note: "e.g. Barista, Manager"  },
            { label: "Email",       width: 28, note: "Work email"             },
            { label: "Phone",       width: 16, note: "e.g. 555-0101"          },
            { label: "Start Date",  width: 14, note: "YYYY-MM-DD"             },
          ],
          rows: [
            ["Jane Doe",   "Barista",       "jane@example.com", "555-0101", "2023-01-15"],
            ["Mark Smith", "Shift Manager", "mark@example.com", "555-0102", "2022-06-01"],
          ]
        })
      },
      {
        name: "📦 Inventory",
        ws: buildSheet({
          headers: [
            { label: "Item",          width: 28, note: "Product name"        },
            { label: "Quantity",      width: 13, note: "Current stock"       },
            { label: "Unit",          width: 12, note: "e.g. kg, litres"     },
            { label: "Reorder Level", width: 16, note: "Alert when below..."  },
          ],
          rows: [
            ["Coffee Beans (Arabica)", 50,  "kg",     10],
            ["Whole Milk",             30,  "litres",  5],
            ["Pastry Cups",            200, "units",  50],
          ]
        })
      },
      {
        name: "🧑 Customers",
        ws: buildSheet({
          headers: [
            { label: "Full Name",      width: 22, note: "Customer name"       },
            { label: "Email",          width: 28, note: "Contact email"       },
            { label: "Phone",          width: 16, note: "e.g. 555-2001"       },
            { label: "Loyalty Points", width: 16, note: "Leave 0 if none"     },
            { label: "Notes",          width: 32, note: "Any preferences etc." },
          ],
          rows: [
            ["Alice Johnson", "alice@example.com", "555-2001", 120, "Prefers oat milk"],
            ["Bob Williams",  "bob@example.com",   "555-2002",  45, ""],
          ]
        })
      },
      {
        name: "🧾 Orders",
        ws: buildSheet({
          headers: [
            { label: "Order ID",       width: 14, note: "e.g. ORD-001"         },
            { label: "Customer Email", width: 28, note: "Must match Customers"  },
            { label: "Table No.",      width: 12, note: "Must match Tables"     },
            { label: "Items Summary",  width: 34, note: "e.g. Latte x2"        },
            { label: `Total (${currency.symbol})`, width: 13, note: `Numbers only, in ${currency.code}`, fmt: priceFmt },
            { label: "Status",         width: 14, note: "completed / pending"   },
            { label: "Date",           width: 14, note: "YYYY-MM-DD"            },
          ],
          rows: [
            ["ORD-001", "alice@example.com", 2, "Cappuccino x2, Croissant x1", 12.25, "completed", "2024-05-01"],
            ["ORD-002", "bob@example.com",   1, "House Blend x1",               3.00, "completed", "2024-05-02"],
          ]
        })
      },
    ];

    // ── Instructions sheet ───────────────────────────────────────────────────
    (() => {
      const ws  = {};
      const titleStyle = {
        font:      { bold: true, sz: 16, color: { rgb: BRAND }, name: "Calibri" },
        fill:      { fgColor: { rgb: ACCENT_BG } },
        alignment: { horizontal: "left", vertical: "center" }
      };
      const subStyle = {
        font:      { bold: true, sz: 11, color: { rgb: BRAND_MID }, name: "Calibri" },
        fill:      { fgColor: { rgb: "FFFFFF" } },
        alignment: { horizontal: "left", vertical: "center" }
      };
      const bodyStyle = {
        font:      { sz: 10, name: "Calibri", color: { rgb: "3D3D3D" } },
        fill:      { fgColor: { rgb: "FFFFFF" } },
        alignment: { horizontal: "left", vertical: "top", wrapText: true }
      };
      const tipStyle = {
        font:      { sz: 10, italic: true, name: "Calibri", color: { rgb: NOTE_FG } },
        fill:      { fgColor: { rgb: ACCENT_BG } },
        alignment: { horizontal: "left", vertical: "top", wrapText: true }
      };

      const rows = [
        [titleStyle, "BrewCRM — Data Import Template", null],
        [bodyStyle, `Currency: ${currency.name} (${currency.code}, ${currency.symbol})`, null],
        [null, "", null],
        [subStyle, "HOW TO USE THIS FILE", null],
        [bodyStyle, "1.  Each tab (Menu Items, Tables, Staff, Inventory, Customers, Orders) is a separate section.", null],
        [bodyStyle, "2.  Row 1 is the header row — do not rename or delete any headers.", null],
        [bodyStyle, "3.  Row 2 shows hints about what each column expects — you can delete it before uploading.", null],
        [bodyStyle, "4.  Add your data from row 3 onwards. Add as many rows as you need.", null],
        [bodyStyle, "5.  Delete the example rows once you've entered your real data.", null],
        [bodyStyle, "6.  Save the file as .xlsx, then go back to the BrewCRM setup wizard.", null],
        [bodyStyle, "7.  Choose  Upload Backup, select this file, and click Import Data.", null],
        [bodyStyle, "8.  Your data will be parsed and saved to your CRM account automatically.", null],
        [null, "", null],
        [subStyle, "TIPS", null],
        [tipStyle, "•  Dates must be in YYYY-MM-DD format (e.g. 2024-05-15).", null],
        [tipStyle, `•  Prices and quantities must be numbers — no ${currency.symbol} signs or commas.`, null],
        [tipStyle, "•  Emails in the Orders sheet must match exactly what's in the Customers sheet.", null],
        [tipStyle, "•  Table numbers in Orders must match the numbers in the Tables sheet.", null],
        [tipStyle, "•  You can leave optional columns blank — just don't delete the column itself.", null],
      ];

      rows.forEach(([style, text], ri) => {
        const addr = XLSX.utils.encode_cell({ r: ri, c: 0 });
        ws[addr] = style ? { v: text, t: "s", s: style } : { v: text, t: "s" };
      });

      ws["!ref"]  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: 0 } });
      ws["!cols"] = [{ wch: 90 }];
      ws["!rows"] = rows.map(([, text], i) => ({ hpt: i === 0 ? 32 : text === "" ? 10 : 22 }));

      XLSX.utils.book_append_sheet(wb, ws, "📖 Instructions");
    })();

    // Add data sheets (Instructions first, data sheets after)
    sheets.forEach(({ name, ws }) => XLSX.utils.book_append_sheet(wb, ws, name));

    XLSX.writeFile(wb, `brewcrm-import-template-${currency.code.toLowerCase()}.xlsx`);
  };

  if (window.XLSX) {
    build();
  } else {
    loadXLSX().then(build).catch(() => {
      // Silently no-op — the user can just click Download Template again.
    });
  }
}

export default function DataImportStep({ settings, onNext, onBack, onSkip, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [cloudSaveError, setCloudSaveError] = useState(null);
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importSource, setImportSource] = useState('template'); // 'template' or 'file'
  const [parsedFileData, setParsedFileData] = useState(null);
  const [templateCurrency, setTemplateCurrency] = useState(
    () => TEMPLATE_CURRENCIES.some(c => c.code === settings?.currency) ? settings.currency : 'GBP'
  );
  const intervalRef = useRef(null);
  const cloudSaveTimeoutRef = useRef(null);
  const currentFileRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up any in-flight timers if the component unmounts mid-import
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (cloudSaveTimeoutRef.current) {
        clearTimeout(cloudSaveTimeoutRef.current);
      }
    };
  }, []);

  const validateFile = useCallback((file) => {
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError({
        title: 'Unsupported File Type',
        message: `Please upload a ${ALLOWED_EXTENSIONS.join(', ')} file.`
      });
      return false;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError({
        title: 'File Too Large',
        message: `Please choose a file smaller than ${MAX_FILE_SIZE_MB}MB.`
      });
      return false;
    }
    return true;
  }, [setError]);

  const parseUploadedFile = useCallback((file) => {
    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    // Guards every async completion below: if the user has since selected a
    // different file (or removed it) before this parse finishes, its result
    // is stale and must not overwrite whatever is current.
    const isStale = () => currentFileRef.current !== file;

    const parseWorkbook = (wb) => {
      if (isStale()) return;
      const sheetMap = {
        'Menu Items': 'menuItems',
        'Tables':     'tables',
        'Staff':      'staff',
        'Inventory':  'inventory',
        'Customers':  'customers',
        'Orders':     'orders',
      };
      const result = {};
      Object.entries(sheetMap).forEach(([sheetName, key]) => {
        const ws = wb.Sheets[sheetName];
        if (ws) {
          result[key] = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
        }
      });
      if (Object.keys(result).length) {
        setParsedFileData(result);
      } else {
        setParsedFileData(null);
        setError({
          title: 'No Recognized Sheets Found',
          message: `Couldn't find any matching tabs (${Object.keys(sheetMap).join(', ')}) in this workbook. Check the sheet names haven't been changed.`
        });
      }
    };

    const run = () => {
      if (isStale()) return;
      const reader = new FileReader();
      reader.onerror = () => {
        if (isStale()) return;
        setParsedFileData(null);
        setError({ title: 'Could Not Read File', message: 'There was a problem reading this file. Please try again or choose a different file.' });
      };
      if (ext === '.json') {
        reader.onload = (ev) => {
          if (isStale()) return;
          try { setParsedFileData(JSON.parse(ev.target.result)); }
          catch { setParsedFileData(null); setError({ title: 'Invalid JSON', message: 'The file could not be parsed.' }); }
        };
        reader.readAsText(file);
      } else {
        // .xlsx or .csv — use SheetJS
        reader.onload = (ev) => {
          if (isStale()) return;
          try {
            const wb = window.XLSX.read(ev.target.result, { type: 'array' });
            if (ext === '.csv') {
              // CSV = single sheet, try to map by first column header
              const ws = wb.Sheets[wb.SheetNames[0]];
              const rows = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
              setParsedFileData({ raw: rows });
            } else {
              parseWorkbook(wb);
            }
          } catch {
            setParsedFileData(null);
            setError({ title: 'Could not read file', message: 'Make sure it is a valid Excel or CSV file.' });
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };

    if (window.XLSX) {
      run();
    } else {
      loadXLSX().then(run).catch(() => {
        if (isStale()) return;
        setParsedFileData(null);
        setError({ title: 'Could Not Read File', message: 'The file reader failed to load. Please check your connection and try again.' });
      });
    }
  }, [setError]);

  const handleFileSelect = useCallback((e) => {
    if (isImporting || isSavingToCloud) return;
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setError(null);
      setImportFile(file);
      setParsedFileData(null);
      setIsImportComplete(false);
      setCloudSaveError(null);
      currentFileRef.current = file;
      parseUploadedFile(file);
    }
  }, [validateFile, setError, parseUploadedFile, isImporting, isSavingToCloud]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isImporting || isSavingToCloud) return;
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setError(null);
      setImportFile(file);
      setParsedFileData(null);
      setIsImportComplete(false);
      setCloudSaveError(null);
      currentFileRef.current = file;
      parseUploadedFile(file);
    }
  }, [validateFile, setError, parseUploadedFile, isImporting, isSavingToCloud]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveFile = useCallback((e) => {
    e.stopPropagation();
    if (isImporting || isSavingToCloud) return;
    currentFileRef.current = null; // invalidate any in-flight parse for the removed file
    if (fileInputRef.current) fileInputRef.current.value = ''; // allow re-selecting the same file
    setImportFile(null);
    setParsedFileData(null);
    setIsImportComplete(false);
    setCloudSaveError(null);
  }, [isImporting, isSavingToCloud]);

  const handleTemplateSelect = useCallback((templateId) => {
    if (isImporting || isSavingToCloud) return;
    setSelectedTemplate(templateId);
    setImportFile(null);
    setParsedFileData(null);
    setIsImportComplete(false);
    setCloudSaveError(null);
  }, [isImporting, isSavingToCloud]);

  const buildImportData = useCallback(() => ({
    source: importSource,
    template: importSource === 'template' ? selectedTemplate : null,
    fileName: importSource === 'file' ? importFile?.name : null,
    fileSize: importSource === 'file' ? importFile?.size : null,
    // Parsed CRM records ready to persist — from uploaded file or built-in template
    records: importSource === 'file'
      ? parsedFileData
      : (selectedTemplate !== 'blank' ? { _template: selectedTemplate } : null),
    importedAt: new Date().toISOString()
  }), [importSource, selectedTemplate, importFile, parsedFileData]);

  // Persists the imported data to the CRM's cloud backend.
  // buildImportData() now includes a `records` key with the full parsed CRM payload
  // (menuItems, tables, staff, inventory, customers, orders).
  // Swap the simulated timeout below for a real request, e.g.:
  //   const payload = buildImportData();
  //   const res = await fetch('/api/import', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload)           // payload.records holds all CRM data
  //   });
  //   if (!res.ok) throw new Error('Save failed');
  const handleCloudSave = useCallback(async () => {
    if (isSavingToCloud) return;
    setCloudSaveError(null);
    setIsSavingToCloud(true);
    try {
      await new Promise((resolve) => {
        cloudSaveTimeoutRef.current = setTimeout(() => {
          cloudSaveTimeoutRef.current = null;
          resolve();
        }, 1200);
      });
      setIsSavingToCloud(false);
      setIsImportComplete(true);
    } catch (err) {
      setIsSavingToCloud(false);
      setCloudSaveError('Could not save your data to the cloud. Check your connection and try again.');
    }
  }, [isSavingToCloud]);

  const handleImport = useCallback(() => {
    if (isImporting || isSavingToCloud) return;

    if (importSource === 'file' && !importFile) {
      setError({ title: 'No File Selected', message: 'Please select a backup file to import.' });
      return;
    }

    if (importSource === 'file' && importFile && !parsedFileData) {
      setError({ title: 'Still Processing File', message: 'Your file is still being read. Please wait a moment and try again.' });
      return;
    }

    setError(null);
    setCloudSaveError(null);
    setIsImporting(true);
    setIsImportComplete(false);
    setImportProgress(0);

    // Simulate reading/parsing the local file or template
    // (progress tracked in a plain local var, not derived inside the setState
    // updater, so the completion side-effects below can't be double-invoked)
    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress = Math.min(progress + 10, 100);
      setImportProgress(progress);
      if (progress >= 100) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsImporting(false);
        // Once the local import finishes, push the result up to the cloud
        handleCloudSave();
      }
    }, 200);
  }, [importSource, importFile, setError, handleCloudSave, isImporting, isSavingToCloud]);

  const handleNext = useCallback(() => {
    onNext({ importData: buildImportData() });
  }, [buildImportData, onNext]);

  const hasSelection = (importSource === 'template' && selectedTemplate !== 'blank') ||
    (importSource === 'file' && !!importFile);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Data Import
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Import existing data from templates or backup files to get started quickly.
        </p>
      </div>

      {/* Import Source Selection */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>📥</span>
          Import Source
        </h4>

        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => setImportSource('template')}
            disabled={isImporting || isSavingToCloud}
            style={{
              flex: 1,
              padding: "16px",
              background: importSource === 'template' ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
              border: importSource === 'template' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
              Use Template
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
              Pre-configured data
            </div>
          </button>

          <button
            onClick={() => setImportSource('file')}
            disabled={isImporting || isSavingToCloud}
            style={{
              flex: 1,
              padding: "16px",
              background: importSource === 'file' ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
              border: importSource === 'file' ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
              Upload Backup
            </div>
            <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
              Import from file
            </div>
          </button>
        </div>

        {/* Template Selection */}
        {importSource === 'template' && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 12 }}>
              Select a template to get started:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              {IMPORT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  disabled={isImporting || isSavingToCloud}
                  style={{
                    padding: "16px",
                    background: selectedTemplate === template.id 
                      ? "var(--cafe-accent-bg)" 
                      : "var(--cafe-bg)",
                    border: selectedTemplate === template.id 
                      ? "2px solid var(--cafe-accent)" 
                      : "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: "var(--cafe-accent-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24
                  }}>
                    {template.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {template.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)" }}>
                      {template.description}
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <span style={{ marginLeft: "auto", fontSize: 16, color: "var(--cafe-accent)" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        {importSource === 'file' && (
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              padding: "16px 20px",
              background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg) 100%)",
              border: "1px solid var(--cafe-border-light)",
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 1px 3px rgba(139, 69, 19, 0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 10,
                  background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18
                }}>
                  📊
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 2 }}>
                    New here?
                  </div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", lineHeight: 1.4 }}>
                    Download a blank Excel template, fill in your data across the tabs, then upload it below.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={templateCurrency}
                  onChange={(e) => setTemplateCurrency(e.target.value)}
                  disabled={isImporting || isSavingToCloud}
                  aria-label="Template currency"
                  title="Currency for prices in the template"
                  style={{
                    padding: "10px 12px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--cafe-text-primary)",
                    cursor: "pointer"
                  }}
                >
                  {TEMPLATE_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => downloadTemplateFile(templateCurrency)}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 8px rgba(139, 69, 19, 0.25)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span aria-hidden="true">⬇</span>
                  Download Template
                </button>
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload backup file"
              style={{
                padding: "32px",
                border: isDragging ? "2px dashed var(--cafe-accent)" : "2px dashed var(--cafe-border)",
                borderRadius: 12,
                textAlign: "center",
                background: isDragging ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onClick={() => { if (!isImporting && !isSavingToCloud) document.getElementById('file-upload').click(); }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isImporting && !isSavingToCloud) {
                  e.preventDefault();
                  document.getElementById('file-upload').click();
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.background = "var(--cafe-accent-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.background = "var(--cafe-bg)";
                }
              }}
            >
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.xlsx"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">📁</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
                {isDragging ? "Drop your file here" : "Click or drag a backup file here"}
              </div>
              <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                Supports JSON, CSV, and Excel files, up to {MAX_FILE_SIZE_MB}MB
              </div>
              {importFile && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    padding: "12px 16px",
                    background: "var(--cafe-info-bg)",
                    border: "1px solid var(--cafe-info-border)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--cafe-info)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <span aria-hidden="true">📄</span>
                    {importFile.name}
                    <span style={{ color: "var(--cafe-text-tertiary)" }}>({formatFileSize(importFile.size)})</span>
                    <button
                      onClick={handleRemoveFile}
                      aria-label="Remove selected file"
                      style={{
                        marginLeft: 4,
                        border: "none",
                        background: "transparent",
                        color: "var(--cafe-info)",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "0 4px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  {parsedFileData && (
                    <div style={{
                      padding: "10px 16px",
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid #10b981",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--cafe-text-secondary)",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "6px 16px"
                    }}>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>✓ File parsed —</span>
                      {[
                        ['menuItems',  '🍽️ menu items'],
                        ['tables',     '🪑 tables'],
                        ['staff',      '👥 staff'],
                        ['inventory',  '📦 inventory'],
                        ['customers',  '🧑 customers'],
                        ['orders',     '🧾 orders'],
                      ].map(([key, label]) => parsedFileData[key]?.length > 0 && (
                        <span key={key}>{parsedFileData[key].length} {label}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Import Progress */}
      {isImporting && (
        <div style={{
          background: "var(--cafe-bg-surface)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "3px solid var(--cafe-accent)",
              borderTopColor: "transparent",
              animation: "spin 1s linear infinite"
            }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
              Importing data...
            </div>
          </div>
          <div style={{
            height: 8,
            background: "var(--cafe-bg)",
            borderRadius: 4,
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              width: `${importProgress}%`,
              background: "linear-gradient(90deg, var(--cafe-accent), #A0522D)",
              borderRadius: 4,
              transition: "width 0.3s ease"
            }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--cafe-text-secondary)" }}>
            {importProgress}% complete
          </div>
        </div>
      )}

      {isSavingToCloud && (
        <div style={{
          background: "var(--cafe-bg-surface)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "3px solid var(--cafe-accent)",
              borderTopColor: "transparent",
              animation: "spin 1s linear infinite"
            }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Saving to the cloud...
              </div>
              <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                Syncing your data with your CRM account
              </div>
            </div>
          </div>
        </div>
      )}

      {cloudSaveError && !isSavingToCloud && (
        <div style={{
          background: "var(--cafe-bg-surface)",
          border: "1px solid #ef4444",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, color: "#ef4444" }} aria-hidden="true">⚠</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                Cloud save failed
              </div>
              <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                {cloudSaveError}
              </div>
            </div>
          </div>
          <button
            onClick={handleCloudSave}
            disabled={isSavingToCloud}
            style={{
              padding: "10px 20px",
              background: "var(--cafe-bg)",
              border: "1px solid #ef4444",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#ef4444",
              cursor: isSavingToCloud ? "not-allowed" : "pointer",
              opacity: isSavingToCloud ? 0.7 : 1
            }}
          >
            Retry
          </button>
        </div>
      )}

      {isImportComplete && !isImporting && !isSavingToCloud && (
        <div style={{
          background: "var(--cafe-bg-surface)",
          border: "1px solid #10b981",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <span style={{ fontSize: 20, color: "#10b981" }} aria-hidden="true">✓</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
              Import complete
            </div>
            <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
              Your data has been imported and saved to the cloud. Click Continue to proceed.
            </div>
          </div>
        </div>
      )}

      {/* Import Summary */}
      {!isImporting && hasSelection && (
        <div style={{
          background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span>ℹ️</span>
            What will be imported
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
            {[
              { icon: '📋', label: 'Menu items', included: true },
              { icon: '🪑', label: 'Table configuration', included: true },
              { icon: '👥', label: 'Staff data', included: importSource === 'file' },
              { icon: '📦', label: 'Inventory', included: importSource === 'file' },
              { icon: '💳', label: 'Payment history', included: importSource === 'file' },
              { icon: '📊', label: 'Reports & analytics', included: importSource === 'file' }
            ].map((item, idx) => (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px",
                background: "var(--cafe-bg)",
                borderRadius: 8,
                border: "1px solid var(--cafe-border)"
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: "var(--cafe-text-primary)" }}>{item.label}</span>
                {item.included ? (
                  <span style={{ marginLeft: "auto", fontSize: 14, color: "#10b981" }}>✓</span>
                ) : (
                  <span style={{ marginLeft: "auto", fontSize: 14, color: "var(--cafe-text-tertiary)" }}>—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={isLoading || isImporting || isSavingToCloud}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading || isImporting || isSavingToCloud ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
          disabled={isLoading || isImporting || isSavingToCloud}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading || isImporting || isSavingToCloud ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Skip
        </button>
        {hasSelection && !isImportComplete ? (
          <button
            onClick={handleImport}
            disabled={isImporting || isSavingToCloud}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              cursor: isImporting || isSavingToCloud ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              opacity: isImporting || isSavingToCloud ? 0.7 : 1
            }}
          >
            {isImporting ? 'Importing...' : isSavingToCloud ? 'Saving...' : 'Import Data'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isLoading}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isImportComplete ? 'Continue →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  );
}
